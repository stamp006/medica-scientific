import fs from "node:fs/promises";
import path from "node:path";
export class OutputRepository {
    paths;
    constructor(rootDir, outputDirName = "output") {
        const outputDir = path.resolve(rootDir, outputDirName);
        this.paths = {
            rootDir,
            outputDir,
            frontendDashboardPath: path.join(outputDir, "frontend", "bottleneck_dashboard.json"),
        };
    }
    getPaths() {
        return this.paths;
    }
    async clearAllOutput() {
        await fs.rm(this.paths.outputDir, { recursive: true, force: true });
        await fs.mkdir(this.paths.outputDir, { recursive: true });
    }
}
