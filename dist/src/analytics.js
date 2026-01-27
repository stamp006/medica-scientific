/**
 * Bottleneck Analysis Engine for Medica Scientific Simulation Data
 *
 * This module analyzes production bottlenecks independently for each scenario
 * (standard, custom) and produces frontend-ready JSON for dashboard visualization.
 *
 * Key Features:
 * - Dynamic metric detection (no hardcoded queue/process names)
 * - Confidence-based bottleneck scoring
 * - Time window identification
 * - Frontend-ready chart data (Chart.js/Recharts/D3 compatible)
 * - Visual bottleneck highlighting
 */
import fs from 'fs/promises';
import path from 'path';
/**
 * Configuration for bottleneck detection
 */
const CONFIG = {
    thresholds: {
        queue_high_level_pct: 0.5, // 50% of max considered high
        queue_growth_streak_days: 20, // Consecutive days of growth
        queue_days_above_threshold_pct: 0.5, // 50% of days above threshold
        process_high_utilization: 0.9, // 90% utilization considered high
        process_capacity_days_pct: 0.5 // 50% of days at capacity
    },
    scoring: {
        queue_avg_level_weight: 0.3,
        queue_growth_streak_weight: 0.2,
        queue_days_above_weight: 0.3,
        queue_persistence_weight: 0.2,
        process_utilization_weight: 0.3,
        process_capacity_days_weight: 0.3,
        process_upstream_growth_weight: 0.4
    }
};
const CUSTOM_METRIC_OVERRIDES = {
    queues: [
        'custom_queue_2_level_first_pass',
        'custom_queue_2_level_second_pass'
    ],
    processes: [
        'custom_station_2_output_first_pass',
        'custom_deliveries_deliveries'
    ]
};
function getScenarioMetricOverrides(scenarioName) {
    if (scenarioName !== 'custom') {
        return { queues: [], processes: [] };
    }
    return CUSTOM_METRIC_OVERRIDES;
}
function mergeMetricKeys(detectedKeys, overrideKeys, scenarioData) {
    const merged = new Set(detectedKeys);
    for (const key of overrideKeys) {
        const existsInData = scenarioData.some(day => Object.prototype.hasOwnProperty.call(day.metrics, key));
        if (existsInData) {
            merged.add(key);
        }
    }
    return Array.from(merged);
}
/**
 * Load scenario data from chunked day files
 *
 * @param {string} scenarioName - Name of scenario (e.g., "standard", "custom")
 * @param {number} startDay - Starting day (inclusive)
 * @param {number} endDay - Ending day (inclusive)
 * @param {string} outputDir - Base output directory
 * @returns {Promise<Array>} Array of day objects with metrics
 */
export async function loadScenarioData(scenarioName, startDay, endDay, outputDir = 'output') {
    const scenarioData = [];
    for (let day = startDay; day <= endDay; day++) {
        const fileName = `day_${String(day).padStart(3, '0')}.json`;
        const filePath = path.join(outputDir, scenarioName, fileName);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const dayData = JSON.parse(content);
            scenarioData.push(dayData);
        }
        catch (error) {
            // If file doesn't exist, skip (some scenarios may have fewer days)
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    return scenarioData;
}
/**
 * Extract queue time series data dynamically
 * Identifies all metrics ending with "_level" as queues
 *
 * @param {Array} scenarioData - Array of day objects
 * @param {string} scenarioName - Scenario name for metric prefix
 * @returns {Array} Array of queue metric objects
 */
export function extractQueueTimeSeries(scenarioData, scenarioName) {
    if (scenarioData.length === 0)
        return [];
    // Identify queue metrics (ending with "_level")
    const firstDay = scenarioData[0];
    const queueMetrics = Object.keys(firstDay.metrics).filter(key => key.endsWith('_level'));
    const overrides = getScenarioMetricOverrides(scenarioName);
    const mergedQueueMetrics = mergeMetricKeys(queueMetrics, overrides.queues, scenarioData);
    const queues = [];
    for (const metricKey of mergedQueueMetrics) {
        // Extract time series
        const timeSeries = scenarioData.map(day => day.metrics[metricKey] ?? null);
        // Calculate statistics
        const validValues = timeSeries.filter(v => v !== null && v !== undefined);
        const maxLevel = Math.max(...validValues);
        const averageLevel = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
        // Calculate growth streak (consecutive days of increase)
        let maxGrowthStreak = 0;
        let currentStreak = 0;
        for (let i = 1; i < timeSeries.length; i++) {
            if (timeSeries[i] > timeSeries[i - 1]) {
                currentStreak++;
                maxGrowthStreak = Math.max(maxGrowthStreak, currentStreak);
            }
            else {
                currentStreak = 0;
            }
        }
        // Calculate days above threshold (80% of max)
        const threshold = maxLevel * 0.8;
        const daysAboveThreshold = validValues.filter(v => v >= threshold).length;
        // Generate human-readable ID and name
        const id = metricKey.replace(`${scenarioName}_`, '');
        const name = id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        queues.push({
            id,
            name,
            metricKey,
            timeSeries,
            maxLevel,
            averageLevel,
            growthStreak: maxGrowthStreak,
            daysAboveThreshold,
            totalDays: validValues.length
        });
    }
    return queues;
}
/**
 * Extract process time series data dynamically
 * Identifies all metrics ending with "_output" as processes
 *
 * @param {Array} scenarioData - Array of day objects
 * @param {string} scenarioName - Scenario name for metric prefix
 * @returns {Array} Array of process metric objects
 */
export function extractProcessTimeSeries(scenarioData, scenarioName) {
    if (scenarioData.length === 0)
        return [];
    // Identify process metrics (ending with "_output")
    const firstDay = scenarioData[0];
    const processMetrics = Object.keys(firstDay.metrics).filter(key => key.endsWith('_output'));
    const overrides = getScenarioMetricOverrides(scenarioName);
    const mergedProcessMetrics = mergeMetricKeys(processMetrics, overrides.processes, scenarioData);
    const processes = [];
    for (const metricKey of mergedProcessMetrics) {
        // Extract time series
        const timeSeries = scenarioData.map(day => day.metrics[metricKey] ?? null);
        // Calculate statistics
        const validValues = timeSeries.filter(v => v !== null && v !== undefined);
        const maxOutput = Math.max(...validValues);
        const averageOutput = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
        // Try to find corresponding utilization/workload metric
        const baseProcessName = metricKey.replace(/_output$/, '');
        const utilizationKey = Object.keys(firstDay.metrics).find(key => key.startsWith(baseProcessName) && (key.includes('workload') || key.includes('utilization') || key.includes('%')));
        let utilizationRate = null;
        let daysAtCapacity = 0;
        if (utilizationKey) {
            const utilizationSeries = scenarioData.map(day => day.metrics[utilizationKey] ?? null);
            const validUtilization = utilizationSeries.filter(v => v !== null && v !== undefined);
            // Convert percentage to decimal if needed
            const utilizationValues = validUtilization.map(v => v > 1 ? v / 100 : v);
            utilizationRate = utilizationValues.reduce((sum, v) => sum + v, 0) / utilizationValues.length;
            // Days at capacity (>95% utilization)
            daysAtCapacity = utilizationValues.filter(v => v >= 0.95).length;
        }
        // Generate human-readable ID and name
        const id = metricKey.replace(`${scenarioName}_`, '').replace(/_output$/, '');
        const name = id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        processes.push({
            id,
            name,
            metricKey,
            timeSeries,
            maxOutput,
            averageOutput,
            utilizationRate,
            daysAtCapacity,
            totalDays: validValues.length
        });
    }
    return processes;
}
/**
 * Detect primary bottleneck using confidence scoring
 *
 * @param {Array} queueMetrics - Queue metrics from extractQueueTimeSeries
 * @param {Array} processMetrics - Process metrics from extractProcessTimeSeries
 * @returns {Object} Bottleneck information with confidence score
 */
export function detectBottleneck(queueMetrics, processMetrics) {
    const candidates = [];
    // Score each queue
    for (const queue of queueMetrics) {
        let score = 0;
        // High average level
        const avgLevelPct = queue.averageLevel / queue.maxLevel;
        if (avgLevelPct >= CONFIG.thresholds.queue_high_level_pct) {
            score += CONFIG.scoring.queue_avg_level_weight;
        }
        // Long growth streak
        if (queue.growthStreak >= CONFIG.thresholds.queue_growth_streak_days) {
            score += CONFIG.scoring.queue_growth_streak_weight;
        }
        // High days above threshold
        const daysAbovePct = queue.daysAboveThreshold / queue.totalDays;
        if (daysAbovePct >= CONFIG.thresholds.queue_days_above_threshold_pct) {
            score += CONFIG.scoring.queue_days_above_weight;
        }
        // Persistence in latter half (check if average in second half > first half)
        const midpoint = Math.floor(queue.timeSeries.length / 2);
        const firstHalf = queue.timeSeries.slice(0, midpoint).filter(v => v !== null);
        const secondHalf = queue.timeSeries.slice(midpoint).filter(v => v !== null);
        const firstHalfAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
        if (secondHalfAvg > firstHalfAvg * 1.2) { // 20% increase
            score += CONFIG.scoring.queue_persistence_weight;
        }
        candidates.push({
            id: queue.id,
            name: queue.name,
            type: 'queue',
            confidence: Math.min(score, 1.0),
            metrics: queue
        });
    }
    // Score each process
    for (const process of processMetrics) {
        let score = 0;
        // High utilization rate
        if (process.utilizationRate !== null && process.utilizationRate >= CONFIG.thresholds.process_high_utilization) {
            score += CONFIG.scoring.process_utilization_weight;
        }
        // High days at capacity
        if (process.utilizationRate !== null) {
            const daysAtCapacityPct = process.daysAtCapacity / process.totalDays;
            if (daysAtCapacityPct >= CONFIG.thresholds.process_capacity_days_pct) {
                score += CONFIG.scoring.process_capacity_days_weight;
            }
        }
        // Check if output plateaus (low variance in second half)
        const midpoint = Math.floor(process.timeSeries.length / 2);
        const secondHalf = process.timeSeries.slice(midpoint).filter(v => v !== null);
        const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
        const variance = secondHalf.reduce((sum, v) => sum + Math.pow(v - secondHalfAvg, 2), 0) / secondHalf.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / secondHalfAvg;
        // Low variation suggests plateau
        if (coefficientOfVariation < 0.15) { // Less than 15% variation
            score += CONFIG.scoring.process_upstream_growth_weight * 0.5;
        }
        candidates.push({
            id: process.id,
            name: process.name,
            type: 'process',
            confidence: Math.min(score, 1.0),
            metrics: process
        });
    }
    // Select highest scoring candidate
    if (candidates.length === 0) {
        return {
            primary_bottleneck: 'none',
            type: 'none',
            confidence: 0,
            time_window: null
        };
    }
    candidates.sort((a, b) => b.confidence - a.confidence);
    const winner = candidates[0];
    // Determine time window where bottleneck is most severe
    let timeWindow = null;
    if (winner.type === 'queue') {
        // Find window where queue level is consistently high
        const threshold = winner.metrics.maxLevel * 0.8;
        let windowStart = null;
        let windowEnd = null;
        for (let i = 0; i < winner.metrics.timeSeries.length; i++) {
            if (winner.metrics.timeSeries[i] >= threshold) {
                if (windowStart === null)
                    windowStart = i;
                windowEnd = i;
            }
        }
        if (windowStart !== null) {
            timeWindow = { start: windowStart, end: windowEnd };
        }
    }
    else if (winner.type === 'process') {
        // Find window where utilization is consistently high
        if (winner.metrics.utilizationRate !== null) {
            // Use second half as the critical window
            const midpoint = Math.floor(winner.metrics.timeSeries.length / 2);
            timeWindow = { start: midpoint, end: winner.metrics.timeSeries.length - 1 };
        }
    }
    return {
        primary_bottleneck: winner.id,
        type: winner.type,
        confidence: parseFloat(winner.confidence.toFixed(2)),
        time_window: timeWindow
    };
}
/**
 * Build frontend-ready tab payload for a scenario
 *
 * @param {string} scenarioName - Scenario name
 * @param {Array} scenarioData - Array of day objects
 * @param {Object} bottleneckInfo - Bottleneck detection results
 * @param {Array} queueMetrics - Queue metrics
 * @param {Array} processMetrics - Process metrics
 * @returns {Object} Complete tab payload with summary and charts
 */
export function buildTabPayload(scenarioName, scenarioData, bottleneckInfo, queueMetrics, processMetrics) {
    // Generate labels (day numbers)
    const labels = scenarioData.map(day => day.day);
    // Build queue levels chart
    const queueLevelsSeries = queueMetrics.map(queue => ({
        id: queue.id,
        name: queue.name,
        values: queue.timeSeries,
        highlight: queue.id === bottleneckInfo.primary_bottleneck && bottleneckInfo.type === 'queue'
    }));
    // Build process output chart
    const processOutputSeries = processMetrics.map(process => ({
        id: process.id,
        name: process.name,
        values: process.timeSeries,
        highlight: process.id === bottleneckInfo.primary_bottleneck && bottleneckInfo.type === 'process'
    }));
    // Build utilization chart (only for processes with utilization data)
    const utilizationSeries = [];
    for (const process of processMetrics) {
        if (process.utilizationRate !== null) {
            // Extract utilization time series
            const firstDay = scenarioData[0];
            // Use the full metric key to find corresponding utilization metric
            const baseMetricKey = process.metricKey.replace(/_output$/, '');
            const utilizationKey = Object.keys(firstDay.metrics).find(key => key.startsWith(baseMetricKey) && (key.includes('workload') || key.includes('utilization') || key.includes('%')));
            if (utilizationKey) {
                const utilizationTimeSeries = scenarioData.map(day => {
                    const value = day.metrics[utilizationKey];
                    // Convert to percentage if it's a decimal
                    return value !== null && value !== undefined ? (value > 1 ? value : value * 100) : null;
                });
                utilizationSeries.push({
                    id: `${process.id}_utilization`,
                    name: `${process.name} Utilization %`,
                    values: utilizationTimeSeries,
                    highlight: process.id === bottleneckInfo.primary_bottleneck && bottleneckInfo.type === 'process'
                });
            }
        }
    }
    return {
        summary: {
            primary_bottleneck: bottleneckInfo.primary_bottleneck,
            type: bottleneckInfo.type,
            confidence: bottleneckInfo.confidence,
            time_window: bottleneckInfo.time_window
        },
        charts: {
            queue_levels: {
                labels,
                series: queueLevelsSeries
            },
            process_output: {
                labels,
                series: processOutputSeries
            },
            ...(utilizationSeries.length > 0 && {
                utilization: {
                    labels,
                    series: utilizationSeries
                }
            })
        }
    };
}
/**
 * Analyze a scenario for bottlenecks
 * Main orchestrator function
 *
 * @param {string} scenarioName - Scenario name (e.g., "standard", "custom")
 * @param {number} totalDays - Total number of days in simulation
 * @param {string} outputDir - Base output directory
 * @returns {Promise<Object>} Complete tab payload for this scenario
 */
export async function analyzeScenario(scenarioName, totalDays, outputDir = 'output') {
    console.log(`\nAnalyzing scenario: ${scenarioName}`);
    // Load scenario data
    const scenarioData = await loadScenarioData(scenarioName, 0, totalDays - 1, outputDir);
    console.log(`  Loaded ${scenarioData.length} days of data`);
    if (scenarioData.length === 0) {
        console.log(`  ⚠ No data found for scenario: ${scenarioName}`);
        return null;
    }
    // Extract metrics
    const queueMetrics = extractQueueTimeSeries(scenarioData, scenarioName);
    const processMetrics = extractProcessTimeSeries(scenarioData, scenarioName);
    console.log(`  Found ${queueMetrics.length} queues, ${processMetrics.length} processes`);
    // Detect bottleneck
    const bottleneckInfo = detectBottleneck(queueMetrics, processMetrics);
    console.log(`  Primary bottleneck: ${bottleneckInfo.primary_bottleneck} (${bottleneckInfo.type})`);
    console.log(`  Confidence: ${(bottleneckInfo.confidence * 100).toFixed(0)}%`);
    // Build tab payload
    const tabPayload = buildTabPayload(scenarioName, scenarioData, bottleneckInfo, queueMetrics, processMetrics);
    return tabPayload;
}
