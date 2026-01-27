import fs from "node:fs/promises";
import path from "node:path";
export class FileRepository {
    paths;
    constructor(rootDir, uploadDirName = "file") {
        this.paths = {
            rootDir,
            uploadDir: path.resolve(rootDir, uploadDirName),
        };
    }
    getPaths() {
        return this.paths;
    }
    async ensureUploadDir() {
        await fs.mkdir(this.paths.uploadDir, { recursive: true });
    }
    resolveUploadPath(fileName) {
        return path.join(this.paths.uploadDir, fileName);
    }
}
