import { parseSimulationData } from "../../../src/parser.js";
import { writeChunkedOutput } from "../../../src/writer.js";
export class ParseService {
    outputRepository;
    constructor(outputRepository) {
        this.outputRepository = outputRepository;
    }
    async parse(inputFilePath) {
        const { outputDir } = this.outputRepository.getPaths();
        const parsedData = parseSimulationData(inputFilePath);
        const stats = (await writeChunkedOutput(outputDir, parsedData));
        return stats;
    }
}
