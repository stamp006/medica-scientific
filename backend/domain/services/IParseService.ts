export interface ParseStats {
  totalFiles: number;
  simulationId: string;
  sheets: number;
}

export interface IParseService {
  parse(inputFilePath: string): Promise<ParseStats>;
}
