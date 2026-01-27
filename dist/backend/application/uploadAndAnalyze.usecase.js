import path from "node:path";
export class UploadAndAnalyzeUseCase {
    uploadService;
    parseService;
    analyzeService;
    outputRepository;
    rootDir;
    constructor(uploadService, parseService, analyzeService, outputRepository, rootDir) {
        this.uploadService = uploadService;
        this.parseService = parseService;
        this.analyzeService = analyzeService;
        this.outputRepository = outputRepository;
        this.rootDir = rootDir;
    }
    async execute(file) {
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
