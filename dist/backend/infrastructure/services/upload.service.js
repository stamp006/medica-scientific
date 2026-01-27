import fs from "node:fs/promises";
import path from "node:path";
export class UploadService {
    fileRepository;
    constructor(fileRepository) {
        this.fileRepository = fileRepository;
    }
    async upload(file) {
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
