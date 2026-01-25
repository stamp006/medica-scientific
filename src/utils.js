/**
 * Utility functions for data normalization and type conversion
 * Used by the Excel parser to clean and standardize data
 */

/**
 * Normalize column names to a consistent format
 * - Convert to lowercase
 * - Replace spaces and hyphens with underscores
 * - Remove special characters (parentheses, periods, etc.)
 * 
 * @param {string} name - Raw column name from Excel
 * @returns {string} Normalized column name
 * 
 * @example
 * normalizeColumnName("Standard Queue 1-Level") // "standard_queue_1_level"
 * normalizeColumnName("Orders (Accepted)") // "orders_accepted"
 */
export function normalizeColumnName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .toLowerCase()                    // Convert to lowercase
    .replace(/[\s-]+/g, '_')          // Replace spaces and hyphens with underscores
    .replace(/[()[\]{}.,;:!?'"]/g, '') // Remove special characters
    .replace(/_+/g, '_')              // Replace multiple underscores with single
    .replace(/^_|_$/g, '');           // Remove leading/trailing underscores
}

/**
 * Normalize sheet names to lowercase
 * 
 * @param {string} name - Raw sheet name from Excel
 * @returns {string} Normalized sheet name
 * 
 * @example
 * normalizeSheetName("Standard") // "standard"
 * normalizeSheetName("WorkForce") // "workforce"
 */
export function normalizeSheetName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name.toLowerCase();
}

/**
 * Check if a value should be treated as numeric
 * 
 * @param {*} value - Value to check
 * @returns {boolean} True if value is numeric
 */
export function isNumeric(value) {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  // Check if it's already a number
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  
  // Check if string can be converted to number
  if (typeof value === 'string') {
    // Remove commas and whitespace
    const cleaned = value.replace(/,/g, '').trim();
    return !isNaN(cleaned) && cleaned !== '';
  }
  
  return false;
}

/**
 * Convert cell values to appropriate JavaScript types
 * - Numbers remain numbers
 * - Numeric strings are converted to numbers
 * - Empty cells become null
 * - Other values remain as-is
 * 
 * @param {*} value - Raw cell value from Excel
 * @returns {*} Converted value
 */
export function convertValue(value) {
  // Handle null, undefined, and empty strings
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // If already a number, return as-is
  if (typeof value === 'number') {
    return value;
  }
  
  // Try to convert strings to numbers
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Empty after trimming
    if (trimmed === '') {
      return null;
    }
    
    // Remove commas and try conversion
    const cleaned = trimmed.replace(/,/g, '');
    if (isNumeric(cleaned)) {
      return parseFloat(cleaned);
    }
    
    // Return original string if not numeric
    return trimmed;
  }
  
  // Return other types as-is (booleans, dates, etc.)
  return value;
}

/**
 * Check if a column is empty (all values are null/undefined/empty)
 * 
 * @param {Array} values - Array of values from a column
 * @returns {boolean} True if column is empty
 */
export function isEmptyColumn(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return true;
  }
  
  return values.every(val => 
    val === null || 
    val === undefined || 
    val === '' || 
    (typeof val === 'string' && val.trim() === '')
  );
}
