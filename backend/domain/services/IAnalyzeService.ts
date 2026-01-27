export interface AnalyzeResult {
  dashboardPath: string;
  scenariosAnalyzed: number;
}

export interface IAnalyzeService {
  analyze(): Promise<AnalyzeResult>;
}
