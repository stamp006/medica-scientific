import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { UploadAndAnalyzeUseCase } from "./application/uploadAndAnalyze.usecase.js";
import { FileRepository } from "./infrastructure/filesystem/fileRepository.js";
import { OutputRepository } from "./infrastructure/filesystem/outputRepository.js";
import { AnalyzeService } from "./infrastructure/services/analyze.service.js";
import { ParseService } from "./infrastructure/services/parse.service.js";
import { UploadService } from "./infrastructure/services/upload.service.js";
import { UploadController } from "./presentation/upload.controller.js";
import { createUploadRouter } from "./presentation/upload.routes.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..", "..");

const fileRepository = new FileRepository(rootDir);
const outputRepository = new OutputRepository(rootDir);

const uploadService = new UploadService(fileRepository);
const parseService = new ParseService(outputRepository);
const analyzeService = new AnalyzeService(outputRepository);

const uploadAndAnalyzeUseCase = new UploadAndAnalyzeUseCase(
  uploadService,
  parseService,
  analyzeService,
  outputRepository,
  rootDir,
);

const uploadController = new UploadController(uploadAndAnalyzeUseCase);

const app = express();
const port = Number(process.env.PORT ?? 3001);

const { outputDir } = outputRepository.getPaths();
app.use(
  "/output",
  express.static(outputDir, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  }),
);

app.use(createUploadRouter(uploadController, fileRepository));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Upload failed.";
  res.status(400).json({ error: message });
});

app.listen(port, () => {
  console.log(`Upload server listening on http://localhost:${port}`);
});
