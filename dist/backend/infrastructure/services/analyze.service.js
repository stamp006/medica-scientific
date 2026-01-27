import fs from "node:fs/promises";
import path from "node:path";
import { analyzeScenario } from "../../../src/analytics.js";
const SCENARIOS_TO_ANALYZE = ["standard", "custom"];
export class AnalyzeService {
    outputRepository;
    constructor(outputRepository) {
        this.outputRepository = outputRepository;
    }
    async analyze() {
        const { outputDir, frontendDashboardPath } = this.outputRepository.getPaths();
        const metaPath = path.join(outputDir, "meta.json");
        const metaContent = await fs.readFile(metaPath, "utf8");
        const meta = JSON.parse(metaContent);
        const tabs = {};
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
