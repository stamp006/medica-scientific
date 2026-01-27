import fs from "node:fs/promises";
import path from "node:path";
import type { Express } from "express";

import type { IUploadService, UploadMetadata } from "../../domain/services/IUploadService.js";
import { FileRepository } from "../filesystem/fileRepository.js";

export class UploadService implements IUploadService {
  private static readonly FIXED_FILE_NAME = "MBA68-BA650.xlsx";

  constructor(private readonly fileRepository: FileRepository) {}

  async upload(file: Express.Multer.File): Promise<UploadMetadata> {
    await this.fileRepository.ensureUploadDir();

    const { uploadDir } = this.fileRepository.getPaths();
    const targetPath = path.join(uploadDir, UploadService.FIXED_FILE_NAME);
    const tempTargetPath = `${targetPath}.tmp`;

    const targetExists = await fs
      .stat(targetPath)
      .then(() => true)
      .catch(() => false);
    if (targetExists) {
      // Concurrent uploads are allowed; last writer wins.
      console.warn(
        `[upload] Overwriting existing file at ${targetPath}. Last write wins.`,
      );
    }

    // Move the freshly uploaded temp file into place via a temp target, then
    // atomically replace the fixed filename to reduce corruption risk.
    if (file.path !== tempTargetPath) {
      await fs.rename(file.path, tempTargetPath);
    }

    try {
      await fs.rename(tempTargetPath, targetPath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "EEXIST") {
        await fs.unlink(targetPath);
        await fs.rename(tempTargetPath, targetPath);
      } else {
        // Best-effort cleanup: avoid leaving temp files behind.
        await fs.unlink(tempTargetPath).catch(() => undefined);
        throw error;
      }
    }

    return {
      originalName: file.originalname,
      storedFileName: path.basename(targetPath),
      storedPath: targetPath,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
