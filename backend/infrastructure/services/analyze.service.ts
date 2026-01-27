import fs from "node:fs/promises";
import path from "node:path";

import type { AnalyzeResult, IAnalyzeService } from "../../domain/services/IAnalyzeService.js";
import { analyzeScenario } from "../../../src/analytics.js";
import { OutputRepository } from "../filesystem/outputRepository.js";

const SCENARIOS_TO_ANALYZE = ["standard", "custom"] as const;

type MetaShape = {
  simulation_id: string;
  source: string;
  parsed_at: string;
  sheets: Record<string, { days?: number }>;
};

export class AnalyzeService implements IAnalyzeService {
  constructor(private readonly outputRepository: OutputRepository) {}

  async analyze(): Promise<AnalyzeResult> {
    const { outputDir, frontendDashboardPath } = this.outputRepository.getPaths();
    const metaPath = path.join(outputDir, "meta.json");
    const metaContent = await fs.readFile(metaPath, "utf8");
    const meta = JSON.parse(metaContent) as MetaShape;

    const tabs: Record<string, unknown> = {};

    for (const scenarioName of SCENARIOS_TO_ANALYZE) {
      const scenarioMeta = meta.sheets[scenarioName];
      if (!scenarioMeta?.days) {
        continue;
      }

      const tabPayload = await analyzeScenario(scenarioName, scenarioMeta.days, outputDir);
      if (tabPayload) {
        tabs[scenarioName] = tabPayload;
      }
    }

    const dashboard = {
      meta: {
        simulation_id: meta.simulation_id,
        generated_at: new Date().toISOString(),
      },
      tabs,
    };

    await fs.mkdir(path.dirname(frontendDashboardPath), { recursive: true });
    await fs.writeFile(frontendDashboardPath, JSON.stringify(dashboard, null, 2), "utf8");

    return {
      dashboardPath: frontendDashboardPath,
      scenariosAnalyzed: Object.keys(tabs).length,
    };
  }
}
