import fs from "node:fs/promises";
import path from "node:path";

export interface OutputPaths {
  rootDir: string;
  outputDir: string;
  frontendDashboardPath: string;
}

export class OutputRepository {
  private readonly paths: OutputPaths;

  constructor(rootDir: string, outputDirName = "output") {
    const outputDir = path.resolve(rootDir, outputDirName);
    this.paths = {
      rootDir,
      outputDir,
      frontendDashboardPath: path.join(outputDir, "frontend", "bottleneck_dashboard.json"),
    };
  }

  getPaths(): OutputPaths {
    return this.paths;
  }

  async clearAllOutput(): Promise<void> {
    await fs.rm(this.paths.outputDir, { recursive: true, force: true });
    await fs.mkdir(this.paths.outputDir, { recursive: true });
  }
}
