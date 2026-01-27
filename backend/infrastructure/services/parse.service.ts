import type { IParseService, ParseStats } from "../../domain/services/IParseService.js";

import { parseSimulationData } from "../../../src/parser.js";
import { writeChunkedOutput } from "../../../src/writer.js";
import { OutputRepository } from "../filesystem/outputRepository.js";

export class ParseService implements IParseService {
  constructor(private readonly outputRepository: OutputRepository) {}

  async parse(inputFilePath: string): Promise<ParseStats> {
    const { outputDir } = this.outputRepository.getPaths();
    const parsedData = parseSimulationData(inputFilePath);
    const stats = (await writeChunkedOutput(outputDir, parsedData)) as ParseStats;

    return stats;
  }
}
