import express from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

import { UploadController } from "./upload.controller.js";
import { FileRepository } from "../infrastructure/filesystem/fileRepository.js";

function buildMulter(fileRepository: FileRepository): multer.Multer {
  const { uploadDir } = fileRepository.getPaths();

  const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        await fileRepository.ensureUploadDir();
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: (_req, file, cb) => {
      // Store under a temporary name first; the UploadService will atomically
      // replace the single source-of-truth filename.
      const ext = path.extname(file.originalname) || ".xlsx";
      const tempName = `upload-${Date.now()}-${crypto.randomUUID()}${ext}.uploading`;
      cb(null, tempName);
    },
  });

  return multer({
    storage,
    fileFilter: (_req, file, cb) => {
      if (path.extname(file.originalname).toLowerCase() !== ".xlsx") {
        cb(new Error("Only .xlsx files are supported."));
        return;
      }
      cb(null, true);
    },
  });
}

export function createUploadRouter(
  controller: UploadController,
  fileRepository: FileRepository,
): express.Router {
  const router = express.Router();
  const upload = buildMulter(fileRepository);

  router.post("/upload", upload.single("file"), controller.handle);

  return router;
}
