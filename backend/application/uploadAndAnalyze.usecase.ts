import path from "node:path";
import type { Express } from "express";

import type { IAnalyzeService } from "../domain/services/IAnalyzeService.js";
import type { IParseService } from "../domain/services/IParseService.js";
import type { IUploadService } from "../domain/services/IUploadService.js";
import { OutputRepository } from "../infrastructure/filesystem/outputRepository.js";

export interface UploadAndAnalyzeResult {
  success: true;
  outputFile: string;
}

export class UploadAndAnalyzeUseCase {
  constructor(
    private readonly uploadService: IUploadService,
    private readonly parseService: IParseService,
    private readonly analyzeService: IAnalyzeService,
    private readonly outputRepository: OutputRepository,
    private readonly rootDir: string,
  ) {}

  async execute(file: Express.Multer.File): Promise<UploadAndAnalyzeResult> {
    const uploadedFile = await this.uploadService.upload(file);

    await this.outputRepository.clearAllOutput();

    await this.parseService.parse(uploadedFile.storedPath);

    const analyzeResult = await this.analyzeService.analyze();
    const outputFile = path.relative(this.rootDir, analyzeResult.dashboardPath);

    return {
      success: true,
      outputFile,
    };
  }
}
