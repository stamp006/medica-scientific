import express from "express";
import multer from "multer";
import path from "node:path";
function buildMulter(fileRepository) {
    const { uploadDir } = fileRepository.getPaths();
    const storage = multer.diskStorage({
        destination: async (_req, _file, cb) => {
            try {
                await fileRepository.ensureUploadDir();
                cb(null, uploadDir);
            }
            catch (error) {
                cb(error, uploadDir);
            }
        },
        filename: (_req, file, cb) => {
            cb(null, file.originalname);
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
export function createUploadRouter(controller, fileRepository) {
    const router = express.Router();
    const upload = buildMulter(fileRepository);
    router.post("/upload", upload.single("file"), controller.handle);
    return router;
}
