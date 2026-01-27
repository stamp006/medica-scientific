import type { Express } from "express";

export interface UploadMetadata {
  originalName: string;
  storedFileName: string;
  storedPath: string;
  size: number;
  mimeType: string;
}

export interface IUploadService {
  upload(file: Express.Multer.File): Promise<UploadMetadata>;
}
