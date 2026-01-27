import fs from "node:fs/promises";
import path from "node:path";

export interface UploadPaths {
  rootDir: string;
  uploadDir: string;
}

export class FileRepository {
  private readonly paths: UploadPaths;

  constructor(rootDir: string, uploadDirName = "file") {
    this.paths = {
      rootDir,
      uploadDir: path.resolve(rootDir, uploadDirName),
    };
  }

  getPaths(): UploadPaths {
    return this.paths;
  }

  async ensureUploadDir(): Promise<void> {
    await fs.mkdir(this.paths.uploadDir, { recursive: true });
  }

  resolveUploadPath(fileName: string): string {
    return path.join(this.paths.uploadDir, fileName);
  }
}
