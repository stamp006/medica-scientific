import type { NextFunction, Request, Response } from "express";

import { UploadAndAnalyzeUseCase } from "../application/uploadAndAnalyze.usecase.js";

export class UploadController {
  constructor(private readonly useCase: UploadAndAnalyzeUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded." });
        return;
      }

      const result = await this.useCase.execute(req.file);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
