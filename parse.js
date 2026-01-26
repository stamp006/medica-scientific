/**
 * Main Entry Point for Medica Scientific Excel Parser
 * 
 * This script orchestrates the parsing of simulation data from Excel
 * and outputs a normalized JSON file ready for analysis.
 */

import path from 'path';
import { parseSimulationData } from './src/parser.js';
import { writeChunkedOutput } from './src/writer.js';

// Configuration
const INPUT_FILE = 'file/MBA68-BA650.xlsx';
const OUTPUT_DIR = 'output';

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('=== Medica Scientific Data Ingestion ===\n');

        // Parse the Excel file
        console.log('Step 1: Parsing Excel file...');
        const parsedData = parseSimulationData(INPUT_FILE);

        // Write chunked output
        console.log('\nStep 2: Writing chunked output files...');
        const stats = await writeChunkedOutput(OUTPUT_DIR, parsedData);

        // Report success
        console.log('\n=== Ingestion Complete ===');
        console.log(`✓ Simulation ID: ${stats.simulationId}`);
        console.log(`✓ Sheets processed: ${stats.sheets}`);
        console.log(`✓ Total files created: ${stats.totalFiles}`);
        console.log(`✓ Output directory: ${OUTPUT_DIR}/\n`);

    } catch (error) {
        console.error('\n✗ Error during data ingestion:');
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the main function
main();
