/**
 * managing-local-files.ts — CopilotForge Cookbook Recipe
 *
 * WHAT THIS DOES:
 *   Uses Copilot to intelligently organize files in a directory based on metadata
 *   (extension, date, size, or custom AI-driven grouping). Supports dry-run mode
 *   to preview changes before applying them.
 *
 * WHEN TO USE THIS:
 *   - Organizing messy Downloads folders by file type or date
 *   - Sorting project files into logical subdirectories
 *   - Batch file operations guided by AI analysis
 *   - Building file management tools with intelligent classification
 *
 * HOW TO RUN:
 *   1. npm install @github/copilot-sdk
 *   2. Set GITHUB_TOKEN: export GITHUB_TOKEN="{{github_token}}"
 *   3. npx ts-node managing-local-files.ts
 *
 * PREREQUISITES:
 *   - Node.js 18+
 *   - TypeScript 5+
 *   - GitHub Copilot SDK access
 *   - Valid GitHub token with Copilot access
 *
 * EXPECTED OUTPUT:
 *   [FileManager] Started
 *   [FileManager] Analyzing {{file_count}} files in {{target_folder}}
 *   [Copilot] Suggested grouping strategy: {{strategy}}
 *   [DRY RUN] Would create: {{example_target_1}}
 *   [DRY RUN] Would create: {{example_target_2}}
 *   [FileManager] Preview complete ({{operation_count}} operations)
 */

// --- Imports ---
// All imports are included — no "install this separately" surprises.
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import { exec as execCallback } from "node:child_process";

const exec = promisify(execCallback);

// --- Types ---

/** Represents a file to be organized. */
interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  modifiedDate: Date;
}

/** A proposed file move operation. */
interface FileOperation {
  sourcePath: string;
  targetPath: string;
  reason: string; // Why this grouping was chosen
}

/** Grouping strategy for organizing files. */
type GroupingStrategy = "extension" | "date" | "size" | "ai-driven";

/** Configuration for organizing files. */
interface OrganizeConfig {
  targetFolder: string; // Folder to organize
  strategy?: GroupingStrategy; // How to group files
  dryRun?: boolean; // Preview changes without applying
  excludePatterns?: string[]; // File patterns to skip (e.g., ["*.tmp", ".*"])
}

// --- File Manager ---

/**
 * Manages file organization with Copilot assistance.
 * Analyzes files in a directory and suggests intelligent groupings.
 *
 * Usage:
 *   const manager = new FileOrganizer();
 *   await manager.start();
 *   await manager.organize({ targetFolder: "{{target_folder}}", dryRun: true });
 *   await manager.stop();
 */
class FileOrganizer {
  private isStarted: boolean = false;

  /**
   * Initializes the Copilot SDK client.
   * Must be called before organizing files.
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      console.warn("[FileManager] Already started");
      return;
    }

    // TODO: Replace with actual CopilotClient initialization:
    //
    //   import { CopilotClient, approveAll } from "@github/copilot-sdk";
    //   this.client = new CopilotClient();
    //   await this.client.start();
    //
    //   this.session = await this.client.createSession({
    //     onPermissionRequest: approveAll,
    //     model: "{{model_name}}",
    //   });

    this.isStarted = true;
    console.log("[FileManager] Started");
  }

  /**
   * Organizes files in the target folder according to the specified strategy.
   * If dryRun is true, shows a preview without making changes.
   */
  async organize(config: OrganizeConfig): Promise<void> {
    if (!this.isStarted) {
      throw new FileOrganizerError("Manager not started. Call start() first.");
    }

    const { targetFolder, strategy = "extension", dryRun = false, excludePatterns = [] } = config;

    // Validate that the target folder exists.
    await this.validateFolder(targetFolder);

    // Scan the folder for files.
    const files = await this.scanFolder(targetFolder, excludePatterns);
    console.log(`[FileManager] Analyzing ${files.length} files in ${targetFolder}`);

    if (files.length === 0) {
      console.log("[FileManager] No files to organize");
      return;
    }

    // Generate file operations based on the strategy.
    const operations = await this.generateOperations(files, strategy, targetFolder);

    // Preview or apply the changes.
    if (dryRun) {
      this.previewOperations(operations);
      console.log(`[FileManager] Preview complete (${operations.length} operations)`);
    } else {
      await this.applyOperations(operations);
      console.log(`[FileManager] Organized ${files.length} files`);
    }
  }

  /**
   * Shuts down the Copilot SDK client.
   * Should be called when done organizing files.
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      console.warn("[FileManager] Not started");
      return;
    }

    // TODO: Replace with actual cleanup:
    //
    //   await this.session.destroy();
    //   await this.client.stop();

    this.isStarted = false;
    console.log("[FileManager] Stopped");
  }

  // --- Private helpers ---

  private async validateFolder(folderPath: string): Promise<void> {
    try {
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        throw new FileOrganizerError(`${folderPath} is not a directory`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new FileOrganizerError(`Folder not found: ${folderPath}`);
      }
      throw error;
    }
  }

  private async scanFolder(folderPath: string, excludePatterns: string[]): Promise<FileInfo[]> {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const files: FileInfo[] = [];

    for (const entry of entries) {
      // Skip directories and excluded patterns.
      if (entry.isDirectory()) continue;
      if (this.matchesExcludePattern(entry.name, excludePatterns)) continue;

      const fullPath = path.join(folderPath, entry.name);
      const stats = await fs.stat(fullPath);

      files.push({
        name: entry.name,
        path: fullPath,
        size: stats.size,
        extension: path.extname(entry.name).toLowerCase(),
        modifiedDate: stats.mtime,
      });
    }

    return files;
  }

  private matchesExcludePattern(filename: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      // Simple glob matching: "*.tmp" or ".*" (hidden files)
      if (pattern.startsWith("*.")) {
        return filename.endsWith(pattern.slice(1));
      }
      if (pattern === ".*") {
        return filename.startsWith(".");
      }
      return filename === pattern;
    });
  }

  private async generateOperations(
    files: FileInfo[],
    strategy: GroupingStrategy,
    targetFolder: string
  ): Promise<FileOperation[]> {
    switch (strategy) {
      case "extension":
        return this.groupByExtension(files, targetFolder);
      case "date":
        return this.groupByDate(files, targetFolder);
      case "size":
        return this.groupBySize(files, targetFolder);
      case "ai-driven":
        return this.groupByAI(files, targetFolder);
      default:
        throw new FileOrganizerError(`Unknown strategy: ${strategy}`);
    }
  }

  private groupByExtension(files: FileInfo[], targetFolder: string): FileOperation[] {
    const operations: FileOperation[] = [];
    const extensionMap: Record<string, string> = {
      ".jpg": "{{images_folder}}",
      ".jpeg": "{{images_folder}}",
      ".png": "{{images_folder}}",
      ".gif": "{{images_folder}}",
      ".pdf": "{{documents_folder}}",
      ".docx": "{{documents_folder}}",
      ".txt": "{{documents_folder}}",
      ".zip": "{{archives_folder}}",
      ".tar": "{{archives_folder}}",
      ".gz": "{{archives_folder}}",
    };

    for (const file of files) {
      const subfolder = extensionMap[file.extension] || "{{other_folder}}";
      const targetPath = path.join(targetFolder, subfolder, file.name);

      operations.push({
        sourcePath: file.path,
        targetPath: targetPath,
        reason: `Grouped by extension: ${file.extension}`,
      });
    }

    return operations;
  }

  private groupByDate(files: FileInfo[], targetFolder: string): FileOperation[] {
    const operations: FileOperation[] = [];

    for (const file of files) {
      const year = file.modifiedDate.getFullYear();
      const month = String(file.modifiedDate.getMonth() + 1).padStart(2, "0");
      const subfolder = `${year}-${month}`;
      const targetPath = path.join(targetFolder, subfolder, file.name);

      operations.push({
        sourcePath: file.path,
        targetPath: targetPath,
        reason: `Grouped by date: ${subfolder}`,
      });
    }

    return operations;
  }

  private groupBySize(files: FileInfo[], targetFolder: string): FileOperation[] {
    const operations: FileOperation[] = [];

    for (const file of files) {
      let subfolder: string;
      if (file.size < {{small_file_threshold}}) {
        subfolder = "{{small_folder}}"; // < 1 MB
      } else if (file.size < {{medium_file_threshold}}) {
        subfolder = "{{medium_folder}}"; // 1-10 MB
      } else {
        subfolder = "{{large_folder}}"; // > 10 MB
      }

      const targetPath = path.join(targetFolder, subfolder, file.name);

      operations.push({
        sourcePath: file.path,
        targetPath: targetPath,
        reason: `Grouped by size: ${subfolder}`,
      });
    }

    return operations;
  }

  private async groupByAI(files: FileInfo[], targetFolder: string): Promise<FileOperation[]> {
    // TODO: Replace with actual Copilot SDK call:
    //
    //   const fileList = files.map((f) => `${f.name} (${f.size} bytes)`).join("\n");
    //   const prompt = `Analyze these files and suggest logical subdirectories:\n${fileList}`;
    //   const response = await this.session.sendAndWait({ prompt });
    //   // Parse response and create operations...

    // Placeholder: fallback to extension-based grouping.
    console.log("[Copilot] Using AI-driven grouping (simulated)");
    return this.groupByExtension(files, targetFolder);
  }

  private previewOperations(operations: FileOperation[]): void {
    console.log("\n[DRY RUN] Proposed changes:");
    for (const op of operations) {
      const relativePath = path.relative(path.dirname(op.sourcePath), op.targetPath);
      console.log(`  ${path.basename(op.sourcePath)} → ${relativePath}`);
      console.log(`    Reason: ${op.reason}`);
    }
  }

  private async applyOperations(operations: FileOperation[]): Promise<void> {
    for (const op of operations) {
      try {
        // Ensure the target directory exists.
        await fs.mkdir(path.dirname(op.targetPath), { recursive: true });

        // Move the file.
        await fs.rename(op.sourcePath, op.targetPath);
        console.log(`[Moved] ${path.basename(op.sourcePath)} → ${op.targetPath}`);
      } catch (error) {
        console.error(`[Error] Failed to move ${op.sourcePath}:`, error);
        // Continue with other operations even if one fails.
      }
    }
  }
}

// --- Error handling ---

/** Custom error class for file organizer failures. */
class FileOrganizerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileOrganizerError";
  }
}

// --- Example usage ---

async function main() {
  const organizer = new FileOrganizer();

  try {
    await organizer.start();

    // Example: Preview organization by extension (dry run)
    const targetFolder = "{{target_folder}}";

    console.log("\n=== Example: Organize by {{strategy}} ({{dry_run_mode}}) ===");
    await organizer.organize({
      targetFolder: targetFolder,
      strategy: "{{strategy}}",
      dryRun: {{is_dry_run}},
      excludePatterns: {{exclude_patterns}}, // Skip hidden files and temp files
    });

  } catch (error) {
    if (error instanceof FileOrganizerError) {
      // Handle file organizer errors (folder not found, invalid strategy).
      console.error("File organizer error:", error.message);
    } else {
      // Unexpected errors — log and re-throw.
      console.error("Unexpected error:", error);
      throw error;
    }
  } finally {
    await organizer.stop();
  }
}

// Run the example.
main().catch(console.error);
