/**
 * Excel Parser for Medica Scientific Simulation Data
 *
 * This module provides functions to parse Excel files containing simulation output data
 * and convert them into normalized JSON format for analysis and visualization.
 *
 * Key Features:
 * - Filters out graph sheets (sheets ending with "-Graphs")
 * - Normalizes column and sheet names
 * - Converts numeric values appropriately
 * - Removes empty columns
 * - No hardcoded column names - works with any metrics
 */
import XLSX from 'xlsx';
import { normalizeColumnName, normalizeSheetName, convertValue, isEmptyColumn } from './utils.js';
/**
 * Load an Excel workbook from file
 *
 * @param {string} filePath - Path to the Excel file
 * @returns {Object} XLSX workbook object
 * @throws {Error} If file cannot be read
 */
export function loadWorkbook(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        console.log(`✓ Loaded workbook: ${filePath}`);
        console.log(`  Found ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);
        return workbook;
    }
    catch (error) {
        throw new Error(`Failed to load workbook: ${error.message}`);
    }
}
/**
 * Filter out sheets that should be ignored
 * Currently filters out sheets ending with "-Graphs"
 *
 * @param {Object} workbook - XLSX workbook object
 * @returns {Array<{name: string, sheet: Object}>} Array of sheet objects to process
 */
export function filterSheets(workbook) {
    const sheetsToProcess = [];
    for (const sheetName of workbook.SheetNames) {
        // Skip sheets ending with "-Graphs"
        if (sheetName.endsWith('-Graphs')) {
            console.log(`✗ Skipping graph sheet: ${sheetName}`);
            continue;
        }
        sheetsToProcess.push({
            name: sheetName,
            sheet: workbook.Sheets[sheetName]
        });
        console.log(`✓ Will process sheet: ${sheetName}`);
    }
    return sheetsToProcess;
}
/**
 * Parse a single sheet into an array of row objects
 *
 * @param {Object} sheet - XLSX sheet object
 * @param {string} sheetName - Name of the sheet (for logging)
 * @returns {Array<Object>} Array of row objects with normalized column names
 */
export function parseSheet(sheet, sheetName) {
    // Convert sheet to JSON (array of arrays)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (rawData.length === 0) {
        console.log(`  ⚠ Sheet "${sheetName}" is empty`);
        return [];
    }
    // First row is headers
    const rawHeaders = rawData[0];
    const dataRows = rawData.slice(1);
    // Normalize headers and track which columns are empty
    const normalizedHeaders = rawHeaders.map(h => normalizeColumnName(h));
    // Identify empty columns by checking all values in each column
    const columnValues = rawHeaders.map((_, colIndex) => dataRows.map(row => row[colIndex]));
    const emptyColumnIndices = new Set();
    columnValues.forEach((values, index) => {
        if (isEmptyColumn(values)) {
            emptyColumnIndices.add(index);
        }
    });
    // Filter out empty columns from headers
    const filteredHeaders = normalizedHeaders.filter((_, index) => !emptyColumnIndices.has(index) && normalizedHeaders[index] !== '');
    console.log(`  Processing sheet "${sheetName}": ${dataRows.length} rows, ${filteredHeaders.length} columns`);
    if (emptyColumnIndices.size > 0) {
        console.log(`  Removed ${emptyColumnIndices.size} empty columns`);
    }
    // Convert each data row to an object with normalized column names
    const parsedRows = dataRows.map(row => {
        const rowObject = {};
        filteredHeaders.forEach((header, filteredIndex) => {
            // Map back to original column index
            let originalIndex = 0;
            let currentFilteredIndex = 0;
            for (let i = 0; i < normalizedHeaders.length; i++) {
                if (!emptyColumnIndices.has(i) && normalizedHeaders[i] !== '') {
                    if (currentFilteredIndex === filteredIndex) {
                        originalIndex = i;
                        break;
                    }
                    currentFilteredIndex++;
                }
            }
            const rawValue = row[originalIndex];
            rowObject[header] = convertValue(rawValue);
        });
        return rowObject;
    });
    return parsedRows;
}
/**
 * Main function to parse simulation data from Excel file
 *
 * @param {string} filePath - Path to the Excel file
 * @returns {Object} Parsed data with metadata and sheets
 *
 * @example
 * const data = parseSimulationData('file/MBA68-BA650.xlsx');
 * // Returns:
 * // {
 * //   meta: { source: "medica_scientific", file: "MBA68-BA650.xlsx", parsed_at: "..." },
 * //   sheets: { standard: [...], inventory: [...], ... }
 * // }
 */
export function parseSimulationData(filePath) {
    console.log('\n=== Starting Excel Parser ===\n');
    // Load the workbook
    const workbook = loadWorkbook(filePath);
    // Filter sheets to process
    console.log('\n--- Filtering Sheets ---');
    const sheetsToProcess = filterSheets(workbook);
    // Parse each sheet
    console.log('\n--- Parsing Sheets ---');
    const sheets = {};
    for (const { name, sheet } of sheetsToProcess) {
        const normalizedName = normalizeSheetName(name);
        sheets[normalizedName] = parseSheet(sheet, name);
    }
    // Extract filename from path
    const fileName = filePath.split('/').pop();
    // Build output object
    const output = {
        meta: {
            source: "medica_scientific",
            file: fileName,
            parsed_at: new Date().toISOString()
        },
        sheets
    };
    console.log('\n--- Summary ---');
    console.log(`Total sheets processed: ${Object.keys(sheets).length}`);
    for (const [sheetName, rows] of Object.entries(sheets)) {
        console.log(`  ${sheetName}: ${rows.length} rows`);
    }
    return output;
}
