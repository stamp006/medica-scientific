export class UploadController {
    useCase;
    constructor(useCase) {
        this.useCase = useCase;
    }
    handle = async (req, res, next) => {
        try {
            if (!req.file) {
                res.status(400).json({ error: "No file uploaded." });
                return;
            }
            const result = await this.useCase.execute(req.file);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    };
}
