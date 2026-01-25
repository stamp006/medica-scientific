/**
 * Chunked File Writer for Medica Scientific Simulation Data
 * 
 * This module provides functions to write parsed simulation data as chunked JSON files
 * organized by sheet and day, instead of a single monolithic file.
 * 
 * Key Features:
 * - Async file operations for performance
 * - Idempotent directory creation
 * - Parallel writes for independent days
 * - No hardcoded metric names
 * - Memory-efficient incremental writing
 * 
 * Performance Considerations:
 * - Uses fs.promises for non-blocking I/O
 * - Writes days in parallel within each sheet
 * - Creates directories once per sheet, not per day
 * - Avoids loading all days into memory simultaneously
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Ensure a directory exists, creating it if necessary
 * This function is idempotent - safe to call multiple times
 * 
 * @param {string} dirPath - Absolute path to directory
 * @returns {Promise<void>}
 * 
 * Performance: Uses recursive option to create parent directories in one call
 */
export async function ensureDirectory(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        // Ignore error if directory already exists
        if (error.code !== 'EEXIST') {
            throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
        }
    }
}

/**
 * Write the meta.json file containing simulation metadata
 * 
 * @param {string} outputDir - Base output directory
 * @param {Object} metadata - Metadata object to write
 * @param {string} metadata.simulation_id - Simulation identifier
 * @param {string} metadata.source - Data source name
 * @param {string} metadata.file - Original filename
 * @param {string} metadata.parsed_at - ISO timestamp
 * @param {Object} metadata.sheets - Sheet metadata (days, metrics, etc.)
 * @returns {Promise<void>}
 */
export async function writeMeta(outputDir, metadata) {
    const metaPath = path.join(outputDir, 'meta.json');
    const content = JSON.stringify(metadata, null, 2);
    await fs.writeFile(metaPath, content, 'utf8');
    console.log(`✓ Wrote meta.json (${(content.length / 1024).toFixed(2)} KB)`);
}

/**
 * Write a single day's data as a JSON file
 * 
 * @param {string} outputDir - Base output directory
 * @param {string} sheetName - Name of the sheet (e.g., "standard")
 * @param {Object} dayData - Data for a single day
 * @param {number} dayData.day - Day number
 * @param {string} simulationId - Simulation identifier
 * @returns {Promise<void>}
 * 
 * Performance: File writes are async and can be parallelized by caller
 */
export async function writeDayChunk(outputDir, sheetName, dayData, simulationId) {
    // Extract day number and metrics (everything except 'day' field)
    const { day, ...metrics } = dayData;

    // Pad day number with zeros (e.g., 12 -> "012")
    const dayFileName = `day_${String(day).padStart(3, '0')}.json`;
    const sheetDir = path.join(outputDir, sheetName);
    const filePath = path.join(sheetDir, dayFileName);

    // Build the day chunk object
    const chunk = {
        simulation_id: simulationId,
        sheet: sheetName,
        day: day,
        metrics: metrics
    };

    await fs.writeFile(filePath, JSON.stringify(chunk, null, 2), 'utf8');
}

/**
 * Write the history sheet as a single events file
 * History is event-based, not day-based, so we store all events together
 * 
 * @param {string} outputDir - Base output directory
 * @param {Array<Object>} historyData - Array of history events
 * @param {string} simulationId - Simulation identifier
 * @returns {Promise<void>}
 */
export async function writeHistorySheet(outputDir, historyData, simulationId) {
    const historyDir = path.join(outputDir, 'history');
    await ensureDirectory(historyDir);

    const historyFile = {
        simulation_id: simulationId,
        sheet: 'history',
        events: historyData
    };

    const filePath = path.join(historyDir, 'events.json');
    await fs.writeFile(filePath, JSON.stringify(historyFile, null, 2), 'utf8');
    console.log(`  ✓ history: 1 file (${historyData.length} events)`);
}

/**
 * Extract simulation ID from parsed data
 * Uses the maximum day number found across all sheets
 * 
 * @param {Object} parsedData - Parsed simulation data
 * @param {string} fileName - Original Excel filename
 * @returns {string} Simulation ID in format "medica_day_XXX"
 */
function extractSimulationId(parsedData, fileName) {
    let maxDay = 0;

    // Find the maximum day number across all sheets (except history)
    for (const [sheetName, rows] of Object.entries(parsedData.sheets)) {
        if (sheetName === 'history') continue;

        for (const row of rows) {
            if (row.day !== undefined && row.day > maxDay) {
                maxDay = row.day;
            }
        }
    }

    return `medica_day_${maxDay}`;
}

/**
 * Build metadata object for meta.json
 * Automatically extracts metrics and day counts from parsed data
 * 
 * @param {Object} parsedData - Parsed simulation data
 * @param {string} simulationId - Simulation identifier
 * @returns {Object} Metadata object
 */
function buildMetadata(parsedData, simulationId) {
    const metadata = {
        simulation_id: simulationId,
        source: parsedData.meta.source,
        file: parsedData.meta.file,
        parsed_at: parsedData.meta.parsed_at,
        sheets: {}
    };

    // Build metadata for each sheet
    for (const [sheetName, rows] of Object.entries(parsedData.sheets)) {
        if (sheetName === 'history') {
            // History sheet is event-based
            metadata.sheets.history = {
                events: rows.length,
                metrics: rows.length > 0 ? Object.keys(rows[0]) : []
            };
        } else {
            // Regular sheets are day-based
            const metrics = rows.length > 0 ? Object.keys(rows[0]) : [];
            metadata.sheets[sheetName] = {
                days: rows.length,
                metrics: metrics
            };
        }
    }

    return metadata;
}

/**
 * Main function to write parsed data as chunked JSON files
 * 
 * This is the orchestrator function that:
 * 1. Creates the output directory structure
 * 2. Writes meta.json
 * 3. Writes each sheet's data as separate day files
 * 4. Handles history sheet specially (single events file)
 * 
 * @param {string} outputDir - Base output directory
 * @param {Object} parsedData - Parsed simulation data from parser.js
 * @param {string} [customSimulationId] - Optional custom simulation ID
 * @returns {Promise<Object>} Statistics about files written
 * 
 * Performance Notes:
 * - Days within a sheet are written in parallel (Promise.all)
 * - Sheets are processed sequentially to avoid overwhelming file system
 * - Directory creation is done once per sheet
 */
export async function writeChunkedOutput(outputDir, parsedData, customSimulationId = null) {
    console.log('\n=== Writing Chunked Output ===\n');

    // Ensure base output directory exists
    await ensureDirectory(outputDir);

    // Extract or use provided simulation ID
    const simulationId = customSimulationId || extractSimulationId(parsedData, parsedData.meta.file);
    console.log(`Simulation ID: ${simulationId}`);

    // Build and write metadata
    const metadata = buildMetadata(parsedData, simulationId);
    await writeMeta(outputDir, metadata);

    // Statistics tracking
    let totalFiles = 1; // meta.json

    // Process each sheet
    for (const [sheetName, rows] of Object.entries(parsedData.sheets)) {
        if (rows.length === 0) {
            console.log(`  ⚠ Skipping empty sheet: ${sheetName}`);
            continue;
        }

        // Special handling for history sheet
        if (sheetName === 'history') {
            await writeHistorySheet(outputDir, rows, simulationId);
            totalFiles += 1;
            continue;
        }

        // Create sheet directory
        const sheetDir = path.join(outputDir, sheetName);
        await ensureDirectory(sheetDir);

        // Write all day files in parallel for this sheet
        // Performance: Days are independent, so parallel writes are safe
        const writePromises = rows.map(dayData =>
            writeDayChunk(outputDir, sheetName, dayData, simulationId)
        );

        await Promise.all(writePromises);
        totalFiles += rows.length;

        console.log(`  ✓ ${sheetName}: ${rows.length} files`);
    }

    console.log(`\n✓ Total files written: ${totalFiles}`);

    return {
        totalFiles,
        simulationId,
        sheets: Object.keys(parsedData.sheets).length
    };
}
