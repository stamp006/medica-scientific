/**
 * Main Analytics Runner for Bottleneck Analysis
 * 
 * This script orchestrates the bottleneck analysis for all scenarios
 * and generates the frontend-ready dashboard JSON file.
 * 
 * Usage: npm run analyze
 */

import fs from 'fs/promises';
import path from 'path';
import { analyzeScenario } from './src/analytics.js';

// Configuration
const OUTPUT_DIR = 'output';
const META_FILE = 'meta.json';
const FRONTEND_DIR = 'frontend';
const DASHBOARD_FILE = 'bottleneck_dashboard.json';

// Scenarios to analyze (standard and custom only)
const SCENARIOS_TO_ANALYZE = ['standard', 'custom'];

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('=== Medica Scientific Bottleneck Analysis ===\n');

        // Step 1: Load metadata
        console.log('Step 1: Loading simulation metadata...');
        const metaPath = path.join(OUTPUT_DIR, META_FILE);
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const meta = JSON.parse(metaContent);

        console.log(`  Simulation ID: ${meta.simulation_id}`);
        console.log(`  Source: ${meta.source}`);
        console.log(`  Parsed at: ${meta.parsed_at}`);

        // Step 2: Analyze each scenario
        console.log('\nStep 2: Analyzing scenarios...');
        const tabs = {};

        for (const scenarioName of SCENARIOS_TO_ANALYZE) {
            // Check if scenario exists in metadata
            if (!meta.sheets[scenarioName]) {
                console.log(`  ⚠ Scenario "${scenarioName}" not found in metadata, skipping...`);
                continue;
            }

            const totalDays = meta.sheets[scenarioName].days;

            // Analyze scenario
            const tabPayload = await analyzeScenario(scenarioName, totalDays, OUTPUT_DIR);

            if (tabPayload) {
                tabs[scenarioName] = tabPayload;
            }
        }

        // Step 3: Build dashboard JSON
        console.log('\nStep 3: Building dashboard JSON...');
        const dashboard = {
            meta: {
                simulation_id: meta.simulation_id,
                generated_at: new Date().toISOString()
            },
            tabs
        };

        // Step 4: Write output
        console.log('\nStep 4: Writing output file...');
        const frontendDir = path.join(OUTPUT_DIR, FRONTEND_DIR);
        await fs.mkdir(frontendDir, { recursive: true });

        const dashboardPath = path.join(frontendDir, DASHBOARD_FILE);
        await fs.writeFile(
            dashboardPath,
            JSON.stringify(dashboard, null, 2),
            'utf8'
        );

        const fileSize = (await fs.stat(dashboardPath)).size;
        console.log(`  ✓ Wrote dashboard to: ${dashboardPath}`);
        console.log(`  File size: ${(fileSize / 1024).toFixed(2)} KB`);

        // Step 5: Summary
        console.log('\n=== Analysis Complete ===');
        console.log(`✓ Scenarios analyzed: ${Object.keys(tabs).length}`);
        console.log(`✓ Dashboard file: ${FRONTEND_DIR}/${DASHBOARD_FILE}`);

        // Print bottleneck summary
        console.log('\n--- Bottleneck Summary ---');
        for (const [scenarioName, tab] of Object.entries(tabs)) {
            const { summary } = tab;
            console.log(`\n${scenarioName.toUpperCase()}:`);
            console.log(`  Primary Bottleneck: ${summary.primary_bottleneck}`);
            console.log(`  Type: ${summary.type}`);
            console.log(`  Confidence: ${(summary.confidence * 100).toFixed(0)}%`);
            if (summary.time_window) {
                console.log(`  Critical Period: Days ${summary.time_window.start}-${summary.time_window.end}`);
            }
        }

        console.log('\n');

    } catch (error) {
        console.error('\n✗ Error during analysis:');
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the main function
main();
