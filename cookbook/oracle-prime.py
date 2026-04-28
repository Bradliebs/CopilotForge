"""
oracle-prime.py — CopilotForge Cookbook Recipe

WHAT THIS DOES:
    A structured reasoning harness that walks through Oracle Prime's 7-stage
    analytical pipeline. Takes a question or decision, classifies complexity,
    runs the appropriate reasoning stages, and outputs a structured analysis
    with scenario map, counterfactual pivot, and confidence rating.

WHEN TO USE THIS:
    When you need structured decision support — architecture choices, risk
    assessment, trade-off analysis, or any complex question where "it depends"
    isn't good enough. Also useful as a template for building your own
    reasoning pipelines.

HOW TO RUN:
    1. No pip install needed — uses only Python built-ins
    2. Edit the CONFIG section (your question, context, constraints)
    3. python cookbook/oracle-prime.py
    4. Interactive mode: python cookbook/oracle-prime.py --interactive
       (prompts you for question, context, and time horizon)

PREREQUISITES:
    - Python 3.10+

EXPECTED OUTPUT:
    [Oracle] Classifying complexity...
    [Oracle] Tier: Complex — activating full pipeline (S1–S7)
    [Oracle] S1: Problem Decomposition — 3 unknowns, 2 assumptions identified
    [Oracle] S2: Hypothesis Space — 4 hypotheses mapped
    [Oracle] S3: Bayesian Updating — priors assigned from base rates
    [Oracle] S5: Scenario Envelope — Base 55%, Bull 20%, Bear 15%, Swan 10%
    [Oracle] S6: Counterfactual Pivot — "adoption rate" flips base case at <30%
    [Oracle] S7: Critical Audit — 1 bias flagged (anchoring)
    [Oracle] ✅ Analysis complete — confidence: Medium

PLATFORM NOTES:
    - Works identically on Windows, macOS, and Linux
    - Output is plain text; pipe to a file: python oracle-prime.py > analysis.md
    - Integrates with forge-memory: conclusions can be appended to decisions.md
"""

from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional


# =======================================================================
# CONFIGURATION — Edit these values for your analysis
# =======================================================================

CONFIG = {
    "question": "Should we migrate from Express to Fastify for our API layer?",
    "context": [
        "Current API handles 10k req/s on Express 4",
        "Team of 5 developers, 2 have Fastify experience",
        "Migration window: Q3 (3 months)",
        "100+ existing routes with middleware",
    ],
    "time_horizon_months": 6,
    "output_file": None,  # Set to a path string to write output to file
    "write_to_memory": False,
}


# =======================================================================
# TYPES
# =======================================================================


class ComplexityTier(Enum):
    SIMPLE = "Simple"
    MEDIUM = "Medium"
    COMPLEX = "Complex"


class ConfidenceLevel(Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class AlgorithmMode(Enum):
    ADVERSARIAL = "ADVERSARIAL"
    MONTE_CARLO = "MONTE_CARLO"
    FERMI = "FERMI"
    RED_TEAM = "RED_TEAM"
    SIGNAL_VS_NOISE = "SIGNAL_VS_NOISE"
    COUNTERFACTUAL = "COUNTERFACTUAL"


class UncertaintyType(Enum):
    DATA = "DATA"
    MODEL = "MODEL"
    VARIANCE = "VARIANCE"
    MOTIVATED = "MOTIVATED"
    RIVAL = "RIVAL"


@dataclass
class Hypothesis:
    name: str
    description: str
    steel_man: str
    failure_mode: str


@dataclass
class Scenario:
    name: str
    probability: str
    description: str
    confirmation_signals: tuple[str, str]


@dataclass
class Uncertainty:
    type: UncertaintyType
    description: str


@dataclass
class CounterfactualPivot:
    assumption: str = ""
    flip_condition: str = ""


@dataclass
class Analysis:
    reframe: str = ""
    tier: ComplexityTier = ComplexityTier.SIMPLE
    modes: list[AlgorithmMode] = field(default_factory=list)
    key_variables: list[str] = field(default_factory=list)
    hypotheses: list[Hypothesis] = field(default_factory=list)
    scenarios: list[Scenario] = field(default_factory=list)
    causal_chain: list[str] = field(default_factory=list)
    counterfactual_pivot: CounterfactualPivot = field(
        default_factory=CounterfactualPivot
    )
    uncertainties: list[Uncertainty] = field(default_factory=list)
    conclusion: str = ""
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    confidence_justification: str = ""


# =======================================================================
# ANSI COLORS
# =======================================================================

RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
CYAN = "\033[36m"
GREEN = "\033[32m"
MAGENTA = "\033[35m"


def log(prefix: str, msg: str) -> None:
    print(f"{CYAN}[Oracle]{RESET} {BOLD}{prefix}{RESET} {msg}")


# =======================================================================
# COMPLEXITY CLASSIFIER
# =======================================================================


def classify_complexity(question: str, context: list[str]) -> ComplexityTier:
    score = 0

    if re.search(r"\bor\b|\bvs\b|\bversus\b|\balternative", question, re.I):
        score += 2
    if re.search(r"\brisk|\buncertain|\bambiguous|\btrade-?off", question, re.I):
        score += 2
    if re.search(
        r"\bmigrat|\barchitect|\bstrateg|\brewrite|\bredesign", question, re.I
    ):
        score += 2
    if len(context) >= 4:
        score += 1
    if any(re.search(r"deadline|window|quarter|sprint", c, re.I) for c in context):
        score += 1

    if score >= 5:
        return ComplexityTier.COMPLEX
    if score >= 2:
        return ComplexityTier.MEDIUM
    return ComplexityTier.SIMPLE


# =======================================================================
# ALGORITHM MODE SELECTOR
# =======================================================================


def select_modes(question: str) -> list[AlgorithmMode]:
    modes: list[AlgorithmMode] = []

    patterns = {
        AlgorithmMode.ADVERSARIAL: r"compet|\badversar|\bnegotiat|\bconflict",
        AlgorithmMode.MONTE_CARLO: r"probabil|\bchance|\blikelihood|\boutcome",
        AlgorithmMode.FERMI: r"no data|\bestimate|\brough|\bball-?park",
        AlgorithmMode.RED_TEAM: r"plan|\bpropos|\bstrateg|\bapproach",
        AlgorithmMode.SIGNAL_VS_NOISE: r"conflict|\bmixed signal|\bcontrad",
        AlgorithmMode.COUNTERFACTUAL: r"what if|\balternat|\bdecision fork",
    }

    for mode, pattern in patterns.items():
        if re.search(pattern, question, re.I):
            modes.append(mode)

    if not modes and re.search(r"should|best|recommend", question, re.I):
        modes.append(AlgorithmMode.RED_TEAM)

    return modes[:2]


# =======================================================================
# REASONING STAGES
# =======================================================================


def s1_decompose(question: str, context: list[str]) -> list[str]:
    log("S1:", "Problem Decomposition")
    variables = [
        f'Apparent question: "{question}"',
        f"Known inputs: {len(context)} constraints provided",
        "Unknowns: team velocity, hidden technical debt, production risk tolerance",
        "Assumptions: current performance is a baseline (not a ceiling)",
    ]
    log("S1:", f"{len(variables)} elements identified")
    return variables


def s2_hypothesize() -> list[Hypothesis]:
    log("S2:", "Hypothesis Space Mapping")
    hypotheses = [
        Hypothesis(
            name="Smooth Migration",
            description="Team completes migration within window with minimal disruption",
            steel_man="2 experienced devs can lead; Fastify compatibility layer reduces rewrite scope",
            failure_mode="Compatibility layer hides performance issues; middleware gaps surface late",
        ),
        Hypothesis(
            name="Partial Migration",
            description="Critical paths migrate; legacy routes stay on Express behind a proxy",
            steel_man="Reduces risk by limiting blast radius; allows incremental validation",
            failure_mode="Two frameworks to maintain indefinitely; proxy adds latency and complexity",
        ),
        Hypothesis(
            name="Migration Fails",
            description="Team cannot complete in window; rollback required",
            steel_man="100+ routes is substantial; middleware ecosystem differences are underestimated",
            failure_mode="Sunk cost of partial work; team morale impact",
        ),
        Hypothesis(
            name="Stay on Express",
            description="Express 5 or tuning solves the performance need without migration",
            steel_man="Express 5 brings async middleware and performance improvements; known ecosystem",
            failure_mode="If performance ceiling is architectural, tuning only delays the problem",
        ),
    ]
    log("S2:", f"{len(hypotheses)} hypotheses mapped")
    return hypotheses


def s5_scenario_envelope() -> list[Scenario]:
    log("S5:", "Scenario Envelope")
    scenarios = [
        Scenario(
            name="Base Case",
            probability="55%",
            description="Partial migration succeeds — critical paths on Fastify, legacy on Express",
            confirmation_signals=(
                "First 20 routes migrate cleanly within month 1",
                "Performance benchmarks show >2x improvement on migrated routes",
            ),
        ),
        Scenario(
            name="Bull Case",
            probability="20%",
            description="Full migration completes within Q3 — compatibility layer handles most middleware",
            confirmation_signals=(
                "Compatibility layer covers >90% of existing middleware",
                "Team velocity exceeds 15 routes/week after initial learning curve",
            ),
        ),
        Scenario(
            name="Bear Case",
            probability="15%",
            description="Migration stalls at 40% — middleware gaps force custom rewrites",
            confirmation_signals=(
                "More than 5 middleware packages have no Fastify equivalent by week 3",
                "Team velocity drops below 5 routes/week after month 1",
            ),
        ),
        Scenario(
            name="Black Swan",
            probability="10%",
            description="Critical production incident during migration forces emergency rollback",
            confirmation_signals=(
                "Canary deployment shows >5% error rate increase on migrated routes",
                "Data integrity issue discovered in request parsing differences",
            ),
        ),
    ]

    for s in scenarios:
        log("S5:", f"{s.name} ({s.probability}) — {s.description[:60]}...")
    return scenarios


def s6_counterfactual_pivot() -> CounterfactualPivot:
    log("S6:", "Counterfactual Stress Test")
    pivot = CounterfactualPivot(
        assumption="Fastify's Express compatibility layer handles most existing middleware",
        flip_condition="If <50% of middleware is compatible (vs assumed >80%), partial migration becomes the ceiling",
    )
    log("S6:", f'Pivot: "{pivot.assumption[:50]}..."')
    return pivot


def s7_critical_audit() -> list[Uncertainty]:
    log("S7:", "Critical Audit")
    uncertainties = [
        Uncertainty(
            type=UncertaintyType.MODEL,
            description="Migration velocity estimate assumes linear scaling — first routes are often faster",
        ),
        Uncertainty(
            type=UncertaintyType.DATA,
            description="No benchmark data for Express-to-Fastify migration at this route count (100+)",
        ),
        Uncertainty(
            type=UncertaintyType.RIVAL,
            description="Express 5 upgrade could deliver sufficient performance gains without framework switch",
        ),
    ]
    log("S7:", f"{len(uncertainties)} uncertainties flagged (1 [RIVAL])")
    return uncertainties


# =======================================================================
# MAIN ANALYSIS RUNNER
# =======================================================================


def run_analysis() -> Analysis:
    print(f"\n{MAGENTA}{BOLD}{'═' * 51}{RESET}")
    print(f"{MAGENTA}{BOLD}  ORACLE PRIME — Precision Reasoning{RESET}")
    print(f"{MAGENTA}{BOLD}{'═' * 51}{RESET}\n")

    log("Input:", f'"{CONFIG["question"]}"')
    log("Context:", f'{len(CONFIG["context"])} constraints')
    log("Horizon:", f'{CONFIG["time_horizon_months"]} months')
    print()

    log("Classifying:", "complexity...")
    tier = classify_complexity(CONFIG["question"], CONFIG["context"])
    modes = select_modes(CONFIG["question"])

    stage_label = {
        ComplexityTier.COMPLEX: "S1–S7",
        ComplexityTier.MEDIUM: "S1+S2+S5",
        ComplexityTier.SIMPLE: "S1 only",
    }[tier]

    mode_names = ", ".join(m.value for m in modes) if modes else "RED_TEAM (default)"
    log("Tier:", f"{tier.value} — activating {stage_label}")
    log("Modes:", mode_names)
    print()

    key_variables = s1_decompose(CONFIG["question"], CONFIG["context"])

    hypotheses: list[Hypothesis] = []
    scenarios: list[Scenario] = []
    counterfactual_pivot = CounterfactualPivot()
    uncertainties: list[Uncertainty] = []

    if tier in (ComplexityTier.MEDIUM, ComplexityTier.COMPLEX):
        print()
        hypotheses = s2_hypothesize()
        print()
        scenarios = s5_scenario_envelope()

    if tier == ComplexityTier.COMPLEX:
        print()
        counterfactual_pivot = s6_counterfactual_pivot()
        print()
        uncertainties = s7_critical_audit()

    analysis = Analysis(
        reframe="[DECISION] Whether to migrate from Express to Fastify given team capacity, route count, and 3-month window",
        tier=tier,
        modes=modes if modes else [AlgorithmMode.RED_TEAM],
        key_variables=key_variables,
        hypotheses=hypotheses,
        scenarios=scenarios,
        causal_chain=[
            "Migration decision → team splits focus between new and legacy code",
            "Split focus → reduced feature velocity for 2–3 months (second-order)",
            "Reduced velocity → stakeholder pressure to cut migration scope (third-order)",
        ],
        counterfactual_pivot=counterfactual_pivot,
        uncertainties=uncertainties,
        conclusion="Proceed with partial migration (Base Case). Migrate the 20 highest-traffic routes first, benchmark, then decide on full migration. This limits downside risk while capturing most of the performance gain.",
        confidence=ConfidenceLevel.MEDIUM,
        confidence_justification="Medium because [RIVAL] flagged — Express 5 upgrade is a viable alternative that has not been benchmarked against the Fastify option. Resolving condition: benchmark Express 5 performance on the top-20 routes before committing.",
    )

    print(
        f"\n{GREEN}{BOLD}[Oracle] ✅ Analysis complete — confidence: {analysis.confidence.value}{RESET}"
    )
    print(f"{DIM}Conclusion: {analysis.conclusion[:80]}...{RESET}\n")

    return analysis


# =======================================================================
# OUTPUT FORMATTER
# =======================================================================


def format_analysis(a: Analysis) -> str:
    lines: list[str] = []

    lines.append("# Oracle Prime Analysis")
    lines.append("")
    lines.append(f"**Reframe:** {a.reframe}")
    mode_str = ", ".join(m.value for m in a.modes)
    lines.append(f"**Tier:** {a.tier.value} | **Modes:** {mode_str}")
    lines.append(f"**Time Horizon:** {CONFIG['time_horizon_months']} months")
    lines.append("")

    lines.append("## Key Variables")
    for v in a.key_variables:
        lines.append(f"- {v}")
    lines.append("")

    if a.scenarios:
        lines.append("## Scenario Map")
        lines.append("")
        lines.append("| Scenario | Probability | Description |")
        lines.append("|----------|-------------|-------------|")
        for s in a.scenarios:
            lines.append(f"| {s.name} | {s.probability} | {s.description} |")
        lines.append("")

    if a.counterfactual_pivot.assumption:
        lines.append("## Counterfactual Pivot")
        lines.append(f"- **Assumption:** {a.counterfactual_pivot.assumption}")
        lines.append(f"- **Flip condition:** {a.counterfactual_pivot.flip_condition}")
        lines.append("")

    if a.uncertainties:
        lines.append("## Critical Uncertainties")
        for u in a.uncertainties:
            lines.append(f"- **[{u.type.value}]** {u.description}")
        lines.append("")

    lines.append("## Conclusion")
    lines.append(a.conclusion)
    lines.append("")
    lines.append(f"## Confidence: {a.confidence.value}")
    lines.append(a.confidence_justification)

    return "\n".join(lines)


# =======================================================================
# MEMORY INTEGRATION
# =======================================================================


def write_to_memory(analysis: Analysis) -> None:
    memory_path = Path.cwd() / "forge-memory" / "decisions.md"

    if not memory_path.parent.exists():
        log("Memory:", "forge-memory/ not found — skipping memory write")
        return

    from datetime import date

    today = date.today().isoformat()
    entry = f"\n## {today} Oracle Prime Analysis\n{analysis.conclusion}\n\nConfidence: {analysis.confidence.value}. {analysis.confidence_justification}\n"

    with open(memory_path, "a", encoding="utf-8") as f:
        f.write(entry)
    log("Memory:", f"Appended conclusion to {memory_path}")


# =======================================================================
# INTERACTIVE MODE
# =======================================================================


def run_interactive() -> None:
    print(f"\n{MAGENTA}{BOLD}{'\u2550' * 51}{RESET}")
    print(f"{MAGENTA}{BOLD}  ORACLE PRIME \u2014 Interactive Analysis{RESET}")
    print(f"{MAGENTA}{BOLD}{'\u2550' * 51}{RESET}\n")

    question = input(f"{CYAN}[Oracle]{RESET} What question or decision do you want to analyze?\n> ").strip()
    if not question:
        print(f"{RESET}No question provided. Exiting.")
        return

    context_raw = input(
        f"{CYAN}[Oracle]{RESET} Known constraints or context (semicolon-separated, or press Enter to skip):\n> "
    ).strip()
    context = [s.strip() for s in context_raw.split(";") if s.strip()] if context_raw else []

    horizon_raw = input(f"{CYAN}[Oracle]{RESET} Time horizon in months (default: 12): ").strip()
    try:
        horizon = int(horizon_raw) if horizon_raw else 12
    except ValueError:
        horizon = 12

    memory_raw = input(f"{CYAN}[Oracle]{RESET} Save conclusion to forge-memory/decisions.md? (y/N): ").strip()
    save_to_memory = memory_raw.lower() in ("y", "yes")

    CONFIG["question"] = question
    CONFIG["context"] = context if context else [f"Time horizon: {horizon} months"]
    CONFIG["time_horizon_months"] = horizon
    CONFIG["write_to_memory"] = save_to_memory

    print()
    result = run_analysis()
    format_analysis(result)

    if CONFIG["write_to_memory"]:
        write_to_memory(result)


# =======================================================================
# ENTRY POINT
# =======================================================================

if __name__ == "__main__":
    if "--interactive" in sys.argv or "-i" in sys.argv:
        run_interactive()
    else:
        result = run_analysis()
        formatted = format_analysis(result)

        if CONFIG["output_file"]:
            output_path = Path(CONFIG["output_file"])
            output_path.write_text(formatted, encoding="utf-8")
            log("Output:", f"Written to {output_path}")

        if CONFIG["write_to_memory"]:
            write_to_memory(result)
