import fs from "node:fs/promises";
import path from "node:path";
import type { Express } from "express";

import type { IUploadService, UploadMetadata } from "../../domain/services/IUploadService.js";
import { FileRepository } from "../filesystem/fileRepository.js";

export class UploadService implements IUploadService {
  constructor(private readonly fileRepository: FileRepository) {}

  async upload(file: Express.Multer.File): Promise<UploadMetadata> {
    await this.fileRepository.ensureUploadDir();

    const { uploadDir } = this.fileRepository.getPaths();
    const targetPath = path.join(uploadDir, file.originalname);

    if (file.path !== targetPath) {
      await fs.rename(file.path, targetPath);
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
