"""
auto-research.py — CopilotForge Cookbook Recipe

Inspired by: https://github.com/karpathy/autoresearch

WHAT THIS DOES:
  Autonomous experiment harness — a loop that tracks code modifications,
  runs evaluations, keeps improvements, discards failures, and logs
  everything to a TSV. Works with ANY codebase where you have a file to
  modify and a command to evaluate the result.

WHEN TO USE THIS:
  When you want to let an AI agent (or yourself) experiment on code
  autonomously — trying changes, measuring impact, keeping what works.
  Great for: hyperparameter tuning, algorithm optimization, prompt
  engineering, performance benchmarking, or any iterative improvement task.

HOW TO RUN:
  1. No pip install needed — uses only Python standard library
  2. Edit the CONFIG section at the top (target file, eval command, metric)
  3. python cookbook/auto-research.py
  4. Optional: create a program.md for AI-driven experimentation:
     python cookbook/auto-research.py --generate-program

PREREQUISITES:
  - Python 3.10+
  - Git (for experiment tracking)

EXPECTED OUTPUT:
  [AutoResearch] Initializing on branch autoresearch/apr15...
  [AutoResearch] Running baseline evaluation...
  [Baseline] metric: 0.9979 (recorded)
  [Experiment 1] Applied proposal: increase-batch-size.patch
  [Experiment 1] metric: 0.9832 ✅ IMPROVED (was 0.9979)
  [Experiment 2] Applied proposal: swap-optimizer.patch
  [Experiment 2] metric: 1.0100 ❌ WORSE (best: 0.9832) — reverting
  [Experiment 3] Evaluation crashed: OOM — reverting
  [Summary] 3 experiments: 1 kept, 1 discarded, 1 crashed. Best: 0.9832

PLATFORM NOTES:
  - Windows: Git must be in PATH. Use PowerShell or Git Bash.
  - macOS/Linux: Works natively with bash.
  - The eval command runs in a subprocess with configurable timeout.
"""

import subprocess
import sys
import os
import re
import select
import signal
import time
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple, Literal

# =======================================================================
# CONFIGURATION — Edit these values for your project
# =======================================================================
CONFIG = {
    # TODO: Set the file your AI agent will modify
    "target_file": "src/model.py",
    
    # TODO: Set the command to evaluate changes (tests, benchmarks, etc.)
    "eval_command": "python -m pytest tests/",
    
    # TODO: Set a regex to extract the metric from eval output
    # The first capture group should be the numeric value
    "metric_pattern": r"score:\s*([\d.]+)",
    
    # TODO: Is lower better (like loss) or higher better (like accuracy)?
    "lower_is_better": True,
    
    # TODO: Max seconds per evaluation run
    "timeout_seconds": 300,
    
    # TODO: Git branch prefix for experiments
    "branch_prefix": "autoresearch",
    
    # TODO: Max experiments (0 = unlimited, runs until stopped)
    "max_experiments": 0,
}

# =======================================================================
# ANSI Color Codes
# =======================================================================
class Colors:
    RESET = "\033[0m"
    BRIGHT = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"

def log(message: str, color: str = Colors.RESET):
    print(f"{color}{message}{Colors.RESET}")

def log_section(message: str):
    log(f"\n{Colors.BRIGHT}{Colors.CYAN}[AutoResearch]{Colors.RESET} {message}")

def log_experiment(exp_num: int, message: str):
    log(f"{Colors.BRIGHT}[Experiment {exp_num}]{Colors.RESET} {message}")

def log_baseline(message: str):
    log(f"{Colors.MAGENTA}[Baseline]{Colors.RESET} {message}")

def log_success(message: str):
    log(f"  {Colors.GREEN}✅ {message}{Colors.RESET}")

def log_error(message: str):
    log(f"  {Colors.RED}❌ {message}{Colors.RESET}")

def log_warning(message: str):
    log(f"  {Colors.YELLOW}⚠️  {message}{Colors.RESET}")

# =======================================================================
# Git Utilities
# =======================================================================
def git_exec(command: str) -> str:
    """Execute a git command and return output."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Git command failed: {command}\n{e.stderr}")

def get_current_commit() -> str:
    return git_exec("git rev-parse --short HEAD")

def get_current_branch() -> str:
    return git_exec("git rev-parse --abbrev-ref HEAD")

def create_experiment_branch(tag: str) -> str:
    branch_name = f"{CONFIG['branch_prefix']}/{tag}"
    try:
        git_exec(f"git checkout -b {branch_name}")
        log(f"Created and switched to branch: {Colors.CYAN}{branch_name}{Colors.RESET}")
    except RuntimeError:
        # Branch might already exist, try to switch to it
        try:
            git_exec(f"git checkout {branch_name}")
            log(f"Switched to existing branch: {Colors.CYAN}{branch_name}{Colors.RESET}")
        except RuntimeError:
            raise RuntimeError(f"Failed to create or switch to branch {branch_name}")
    return branch_name

def commit_changes(message: str):
    try:
        git_exec("git add -A")
        git_exec(f'git commit -m "{message}"')
    except RuntimeError as e:
        # It's okay if there are no changes to commit
        if "nothing to commit" not in str(e):
            raise

def reset_to_commit(commit_sha: str):
    git_exec(f"git reset --hard {commit_sha}")

# =======================================================================
# Evaluation with Timeout
# =======================================================================
class EvalResult:
    def __init__(self, output: str, exit_code: int, timed_out: bool, error: Optional[str] = None):
        self.output = output
        self.exit_code = exit_code
        self.timed_out = timed_out
        self.error = error

def run_evaluation(command: str, timeout_seconds: int) -> EvalResult:
    """Run evaluation command with timeout."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
        return EvalResult(
            output=result.stdout + result.stderr,
            exit_code=result.returncode,
            timed_out=False,
        )
    except subprocess.TimeoutExpired as e:
        output = ""
        if e.stdout:
            output += e.stdout.decode() if isinstance(e.stdout, bytes) else e.stdout
        if e.stderr:
            output += e.stderr.decode() if isinstance(e.stderr, bytes) else e.stderr
        return EvalResult(
            output=output,
            exit_code=-1,
            timed_out=True,
        )
    except Exception as e:
        return EvalResult(
            output="",
            exit_code=-1,
            timed_out=False,
            error=str(e),
        )

def extract_metric(output: str, pattern: str) -> Optional[float]:
    """Extract numeric metric from output using regex."""
    match = re.search(pattern, output)
    if match and len(match.groups()) >= 1:
        try:
            return float(match.group(1))
        except (ValueError, IndexError):
            return None
    return None

# =======================================================================
# Results Logging
# =======================================================================
class ExperimentResult:
    def __init__(
        self,
        experiment: int,
        commit: str,
        metric: str,
        status: Literal["keep", "discard", "crash"],
        description: str,
        timestamp: str,
    ):
        self.experiment = experiment
        self.commit = commit
        self.metric = metric
        self.status = status
        self.description = description
        self.timestamp = timestamp

def init_results_file(file_path: Path):
    header = "experiment\tcommit\tmetric\tstatus\tdescription\ttimestamp\n"
    file_path.write_text(header, encoding="utf-8")

def append_result(file_path: Path, result: ExperimentResult):
    row = f"{result.experiment}\t{result.commit}\t{result.metric}\t{result.status}\t{result.description}\t{result.timestamp}\n"
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(row)

# =======================================================================
# Proposals Pattern
# =======================================================================
def get_proposals_dir() -> Path:
    return Path.cwd() / "proposals"

def ensure_proposals_dir():
    proposals_dir = get_proposals_dir()
    if not proposals_dir.exists():
        proposals_dir.mkdir(parents=True, exist_ok=True)
        log(f"Created proposals directory: {Colors.DIM}{proposals_dir}{Colors.RESET}")
        
        # Create example README
        example_text = """# Example patch file
# Place .patch files here for the harness to apply
# Or place replacement files with the same name as your target file
# 
# For a .patch file, use standard unified diff format:
# diff --git a/src/model.py b/src/model.py
# --- a/src/model.py
# +++ b/src/model.py
# @@ -10,7 +10,7 @@
# -  learning_rate = 0.001
# +  learning_rate = 0.01
"""
        (proposals_dir / "README.txt").write_text(example_text, encoding="utf-8")

def get_next_proposal() -> Optional[Tuple[Path, Literal["patch", "replacement"]]]:
    proposals_dir = get_proposals_dir()
    if not proposals_dir.exists():
        return None
    
    target_basename = Path(CONFIG["target_file"]).name
    files = sorted([
        f for f in proposals_dir.iterdir()
        if f.suffix == ".patch" or f.name == target_basename
    ])
    
    if not files:
        return None
    
    file = files[0]
    file_type = "patch" if file.suffix == ".patch" else "replacement"
    return (file, file_type)

def apply_proposal(proposal: Tuple[Path, str]) -> str:
    file_path, proposal_type = proposal
    file_name = file_path.name
    
    if proposal_type == "patch":
        try:
            patch_content = file_path.read_text(encoding="utf-8")
            temp_patch = Path("temp.patch")
            temp_patch.write_text(patch_content, encoding="utf-8")
            subprocess.run("git apply temp.patch", shell=True, check=True, capture_output=True)
            temp_patch.unlink()
            file_path.unlink()  # Remove processed proposal
            return f"Applied patch: {file_name}"
        except subprocess.CalledProcessError as e:
            file_path.unlink()  # Remove bad proposal
            raise RuntimeError(f"Failed to apply patch {file_name}: {e.stderr.decode()}")
    else:
        # Replacement file
        content = file_path.read_text(encoding="utf-8")
        Path(CONFIG["target_file"]).write_text(content, encoding="utf-8")
        file_path.unlink()  # Remove processed proposal
        return f"Replaced {CONFIG['target_file']} with {file_name}"

# =======================================================================
# MODIFICATION STEP — This is where AI agent proposes changes
# =======================================================================
# This is where your AI agent proposes changes to the target file.
# In Karpathy's autoresearch, this is done by the AI agent itself
# (Claude, Codex, Copilot) reading program.md and modifying the code.
#
# Options:
#   1. Run this harness manually and make changes yourself between runs
#   2. Use the Copilot SDK to have an AI propose changes programmatically
#   3. Point your AI assistant at program.md and let it drive the loop
#
# For option 3 (recommended), create a program.md in your repo with
# instructions like Karpathy's autoresearch. Then tell your AI:
#   "Read program.md and start experimenting"
#
# For now, this function reads from a "proposals/" directory where
# you (or an AI) can drop modification patches/files.
# =======================================================================
def wait_for_modification(exp_num: int) -> str:
    log(f"{Colors.DIM}Waiting for modification...{Colors.RESET}")
    log(f"{Colors.DIM}Options:{Colors.RESET}")
    log(f"{Colors.DIM}  1. Drop a .patch file in proposals/ directory{Colors.RESET}")
    log(f"{Colors.DIM}  2. Drop a replacement file ({Path(CONFIG['target_file']).name}) in proposals/{Colors.RESET}")
    log(f"{Colors.DIM}  3. Manually edit {CONFIG['target_file']} and press Enter{Colors.RESET}")
    log(f"{Colors.DIM}  4. Press Ctrl+C to stop{Colors.RESET}\n")
    
    # Check for proposals first
    proposal = get_next_proposal()
    if proposal:
        return apply_proposal(proposal)
    
    # Poll for proposals or wait for user input
    try:
        while True:
            proposal = get_next_proposal()
            if proposal:
                return apply_proposal(proposal)
            
            # Check if user pressed Enter
            if sys.platform != "win32":
                # Unix-like systems
                if select.select([sys.stdin], [], [], 2)[0]:
                    sys.stdin.readline()
                    return f"Manual modification (experiment {exp_num})"
            else:
                # Windows - just check for proposals every 2 seconds
                time.sleep(2)
    except KeyboardInterrupt:
        raise
    except Exception as e:
        log_error(f"Error waiting for modification: {e}")
        return f"Failed to get modification (experiment {exp_num})"

# =======================================================================
# Program.md Generator
# =======================================================================
def generate_program_md():
    target_basename = Path(CONFIG["target_file"]).name
    content = f"""# Auto-Research Program

This document tells an AI agent how to autonomously experiment on the codebase.

## Target

**File to modify:** `{CONFIG['target_file']}`

This is the file you will be editing to try improvements.

## Evaluation

**Command:** `{CONFIG['eval_command']}`

**Metric extraction:** The output will contain a metric that looks like this:
```
{CONFIG['metric_pattern']}
```

**Goal:** {"Lower is better (minimize the metric)" if CONFIG['lower_is_better'] else "Higher is better (maximize the metric)"}

## Experiment Protocol

1. **Read** `results.tsv` to see what's been tried and what worked
2. **Analyze** the current state of `{CONFIG['target_file']}`
3. **Propose** a modification (explain your reasoning)
4. **Create** a patch file or replacement file in the `proposals/` directory:
   - For a patch: `proposals/001-description.patch` (use `git diff` format)
   - For a replacement: `proposals/{target_basename}`
5. **Wait** for the harness to apply your change, run the eval, and log the result
6. **Repeat** with the next experiment

## Guidelines

- Start with small, targeted changes
- If something fails, try to understand why before trying something similar
- Keep track of what works and what doesn't by reading `results.tsv`
- Don't repeat failed experiments
- Build on successes incrementally
- If you hit a plateau, try a different approach

## Stopping Criteria

The harness will run {"indefinitely until you stop it (Ctrl+C)" if CONFIG['max_experiments'] == 0 else f"for {CONFIG['max_experiments']} experiments"}.

You should consider stopping when:
- Metric has converged (no improvement in last N experiments)
- You've exhausted reasonable ideas
- Time/resource constraints are reached

## Files You'll Work With

- `{CONFIG['target_file']}` — The code you're improving
- `results.tsv` — Log of all experiments and their results
- `proposals/` — Directory where you place your proposed changes

## Example Workflow

```bash
# Terminal 1: Run the harness
python cookbook/auto-research.py

# Terminal 2: Make proposals
# Read the results
cat results.tsv

# Analyze the current code
cat {CONFIG['target_file']}

# Create a proposal (example: increasing a parameter)
cat > proposals/001-increase-param.patch << 'EOF'
diff --git a/{CONFIG['target_file']} b/{CONFIG['target_file']}
--- a/{CONFIG['target_file']}
+++ b/{CONFIG['target_file']}
@@ -10,7 +10,7 @@
-  learning_rate = 0.001
+  learning_rate = 0.01
EOF

# The harness will automatically detect and apply the proposal
```

## Tips for AI Agents

- Use the git history to see what's been tried: `git log --oneline`
- Read the evaluation output carefully to understand failures
- Keep a mental model of the parameter space you're exploring
- Don't be afraid to backtrack and try different directions
- Document your reasoning in the patch file name or commit message
"""
    
    output_path = Path.cwd() / "program.md"
    output_path.write_text(content, encoding="utf-8")
    log_success(f"Generated program.md at {output_path}")
    log(f"\n{Colors.BRIGHT}Next steps:{Colors.RESET}")
    log(f"  1. Review and customize program.md")
    log(f"  2. Run: {Colors.CYAN}python cookbook/auto-research.py{Colors.RESET}")
    log(f"  3. Tell your AI agent: \"Read program.md and start experimenting\"\n")

# =======================================================================
# Main Experiment Loop
# =======================================================================
def run_experiments():
    # Ensure we're in a git repo
    try:
        git_exec("git rev-parse --git-dir")
    except RuntimeError:
        log_error("Not a git repository. Please run 'git init' first.")
        sys.exit(1)
    
    # Setup
    tag = datetime.now().strftime("%Y%m%d")
    branch_name = create_experiment_branch(tag)
    results_file = Path.cwd() / "results.tsv"
    
    ensure_proposals_dir()
    init_results_file(results_file)
    
    log_section(f"Initialized on branch {Colors.CYAN}{branch_name}{Colors.RESET}")
    log(f"Results will be logged to: {Colors.DIM}{results_file}{Colors.RESET}")
    log(f"Target file: {Colors.DIM}{CONFIG['target_file']}{Colors.RESET}")
    log(f"Eval command: {Colors.DIM}{CONFIG['eval_command']}{Colors.RESET}\n")
    
    # Track metrics
    best_metric: Optional[float] = None
    experiment_count = 0
    keep_count = 0
    discard_count = 0
    crash_count = 0
    
    # Baseline evaluation
    log_baseline("Running baseline evaluation...")
    baseline_commit = get_current_commit()
    baseline_eval = run_evaluation(CONFIG["eval_command"], CONFIG["timeout_seconds"])
    
    if baseline_eval.timed_out:
        log_error(f"Baseline evaluation timed out after {CONFIG['timeout_seconds']}s")
        sys.exit(1)
    
    if baseline_eval.exit_code != 0:
        log_warning(f"Baseline evaluation exited with code {baseline_eval.exit_code}")
        log(f"{Colors.DIM}Output:\n{baseline_eval.output}{Colors.RESET}\n")
    
    baseline_metric = extract_metric(baseline_eval.output, CONFIG["metric_pattern"])
    if baseline_metric is None:
        log_error("Failed to extract metric from baseline output")
        log(f"{Colors.DIM}Pattern: {CONFIG['metric_pattern']}{Colors.RESET}")
        log(f"{Colors.DIM}Output:\n{baseline_eval.output}{Colors.RESET}\n")
        sys.exit(1)
    
    best_metric = baseline_metric
    log_baseline(f"metric: {Colors.BRIGHT}{baseline_metric:.4f}{Colors.RESET} (recorded)")
    
    append_result(
        results_file,
        ExperimentResult(
            experiment=0,
            commit=baseline_commit,
            metric=f"{baseline_metric:.4f}",
            status="keep",
            description="baseline",
            timestamp=datetime.now().isoformat(),
        ),
    )
    
    # Main experiment loop
    max_exp = CONFIG["max_experiments"] if CONFIG["max_experiments"] > 0 else float("inf")
    
    try:
        while experiment_count < max_exp:
            experiment_count += 1
            log_experiment(experiment_count, "Starting...")
            
            # Wait for modification
            try:
                description = wait_for_modification(experiment_count)
                log_experiment(experiment_count, description)
            except Exception as e:
                log_error(f"Modification failed: {e}")
                continue
            
            # Commit the changes
            commit_msg = f"Experiment {experiment_count}: {description}"
            try:
                commit_changes(commit_msg)
            except RuntimeError as e:
                log_warning(f"Git commit skipped: {e}")
            
            current_commit = get_current_commit()
            
            # Run evaluation
            log(f"  {Colors.DIM}Running evaluation...{Colors.RESET}")
            eval_result = run_evaluation(CONFIG["eval_command"], CONFIG["timeout_seconds"])
            
            status: Literal["keep", "discard", "crash"]
            metric: str
            
            if eval_result.timed_out:
                status = "crash"
                metric = "timeout"
                log_error(f"TIMEOUT after {CONFIG['timeout_seconds']}s — reverting")
                reset_to_commit(current_commit + "~1")
                crash_count += 1
            elif eval_result.error:
                status = "crash"
                metric = "error"
                log_error(f"ERROR: {eval_result.error} — reverting")
                reset_to_commit(current_commit + "~1")
                crash_count += 1
            else:
                extracted_metric = extract_metric(eval_result.output, CONFIG["metric_pattern"])
                
                if extracted_metric is None:
                    status = "crash"
                    metric = "parse_error"
                    log_error("Failed to extract metric from output — reverting")
                    log(f"{Colors.DIM}Output:\n{eval_result.output[:500]}...{Colors.RESET}")
                    reset_to_commit(current_commit + "~1")
                    crash_count += 1
                else:
                    metric = f"{extracted_metric:.4f}"
                    improved = (
                        extracted_metric < best_metric
                        if CONFIG["lower_is_better"]
                        else extracted_metric > best_metric
                    )
                    
                    if improved:
                        status = "keep"
                        old_best = best_metric
                        best_metric = extracted_metric
                        log_success(f"IMPROVED: {extracted_metric:.4f} (was {old_best:.4f})")
                        keep_count += 1
                    else:
                        status = "discard"
                        log_error(f"WORSE: {extracted_metric:.4f} (best: {best_metric:.4f}) — reverting")
                        reset_to_commit(current_commit + "~1")
                        discard_count += 1
            
            # Log result
            append_result(
                results_file,
                ExperimentResult(
                    experiment=experiment_count,
                    commit=current_commit,
                    metric=metric,
                    status=status,
                    description=description,
                    timestamp=datetime.now().isoformat(),
                ),
            )
            
            # Print summary
            log(f"{Colors.DIM}  [Total: {experiment_count} | Kept: {keep_count} | Discarded: {discard_count} | Crashed: {crash_count} | Best: {best_metric:.4f}]{Colors.RESET}\n")
    
    except KeyboardInterrupt:
        log(f"\n\n{Colors.YELLOW}Interrupted by user{Colors.RESET}\n")
    
    # Final summary
    log_section("Experiment session complete")
    log(f"{Colors.BRIGHT}Results:{Colors.RESET}")
    log(f"  Total experiments: {experiment_count}")
    log(f"  Kept: {Colors.GREEN}{keep_count}{Colors.RESET}")
    log(f"  Discarded: {Colors.RED}{discard_count}{Colors.RESET}")
    log(f"  Crashed: {Colors.YELLOW}{crash_count}{Colors.RESET}")
    log(f"  Best metric: {Colors.BRIGHT}{Colors.CYAN}{best_metric:.4f}{Colors.RESET}")
    log(f"\nResults saved to: {results_file}\n")

# =======================================================================
# CLI Entry Point
# =======================================================================
def main():
    args = sys.argv[1:]
    
    if "--generate-program" in args or "-g" in args:
        generate_program_md()
        return
    
    run_experiments()

if __name__ == "__main__":
    main()
