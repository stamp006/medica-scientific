# Medica Scientific - Production Analytics System

A complete Node.js-based analytics system for production simulation data. Parses Excel files, stores data efficiently, and automatically identifies bottlenecks with frontend-ready dashboard output.

## Overview

This is a **2-STEP SYSTEM**:
- **STEP 1**: Data ingestion - Parse Excel and store as chunked JSON
- **STEP 2**: Bottleneck analysis - Identify bottlenecks and generate dashboard data

### Key Features

**Data Ingestion (STEP 1)**:
- ✅ **Modular Architecture**: Separate modules for parsing and writing
- ✅ **Smart Sheet Filtering**: Automatically ignores graph sheets
- ✅ **Column Normalization**: Converts column names to lowercase with underscores
- ✅ **Chunked Output**: One file per day per sheet for efficient queries
- ✅ **Async File Operations**: Non-blocking I/O for performance

**Bottleneck Analysis (STEP 2)**:
- ✅ **Dynamic Metric Detection**: No hardcoded queue/process names
- ✅ **Confidence Scoring**: 0-1 confidence scores for bottleneck identification
- ✅ **Time Window Detection**: Identifies critical periods
- ✅ **Frontend-Ready Output**: Chart data for Chart.js/Recharts/D3
- ✅ **Visual Highlighting**: Automatic bottleneck highlighting in charts

## Installation

```bash
# Install dependencies
npm install
```

## Usage

### STEP 1: Parse Excel Data

```bash
# Run the data ingestion
npm start
# or
npm run parse
```

This will:
1. Read the Excel file from `file/MBA68-BA650.xlsx`
2. Filter out graph sheets
3. Parse and normalize all data sheets
4. Write chunked JSON files to `output/` directory

### STEP 2: Analyze Bottlenecks

```bash
# Run the bottleneck analysis
npm run analyze
```

This will:
1. Load scenario data (standard, custom)
2. Identify bottlenecks using confidence scoring
3. Generate frontend-ready dashboard JSON
4. Output to `output/frontend/bottleneck_dashboard.json`

## Output Format

The system generates a chunked directory structure:

```
output/
├── meta.json                    # Simulation metadata
├── history/
│   └── events.json             # History events (event-based)
├── standard/
│   ├── day_000.json
│   ├── day_001.json
│   └── ...
├── custom/
│   ├── day_000.json
│   └── ...
├── inventory/
│   ├── day_000.json
│   └── ...
├── financial/
│   ├── day_000.json
│   └── ...
└── workforce/
    ├── day_000.json
    └── ...
```

### File Formats

#### meta.json
Contains simulation metadata and sheet information:
```json
{
  "simulation_id": "medica_day_199",
  "source": "medica_scientific",
  "file": "MBA68-BA650.xlsx",
  "parsed_at": "2026-01-25T11:12:04.892Z",
  "sheets": {
    "standard": {
      "days": 200,
      "metrics": ["day", "standard_orders_accepted_orders", ...]
    },
    "history": {
      "events": 33,
      "metrics": ["day", "user", "description"]
    }
  }
}
```

#### Day Chunk Files (e.g., standard/day_012.json)
Each file contains data for one day:
```json
{
  "simulation_id": "medica_day_199",
  "sheet": "standard",
  "day": 12,
  "metrics": {
    "standard_orders_accepted_orders": 0,
    "standard_orders_accumulated_orders": 38.719,
    "standard_queue_1_level": 181.88,
    "standard_manual_processing_output": 90.751,
    "standard_deliveries_market_price": 517.815
  }
}
```

#### History Events (history/events.json)
All history events in one file:
```json
{
  "simulation_id": "medica_day_199",
  "sheet": "history",
  "events": [
    {
      "day": 140,
      "user": "taratee006",
      "description": "Updated reorder quantity value to 1600 units."
    }
  ]
}
```

---

### Bottleneck Dashboard Output

**File**: `output/frontend/bottleneck_dashboard.json`

Frontend-ready dashboard data with tab-based structure:

```json
{
  "meta": {
    "simulation_id": "medica_day_199",
    "generated_at": "2026-01-25T13:05:43.578Z"
  },
  "tabs": {
    "standard": {
      "summary": {
        "primary_bottleneck": "queue_5_level",
        "type": "queue",
        "confidence": 0.3,
        "time_window": { "start": 92, "end": 197 }
      },
      "charts": {
        "queue_levels": {
          "labels": [0, 1, 2, ..., 199],
          "series": [
            {
              "id": "queue_1_level",
              "name": "Queue 1 Level",
              "values": [...],
              "highlight": false
            },
            {
              "id": "queue_5_level",
              "name": "Queue 5 Level",
              "values": [...],
              "highlight": true  // ← BOTTLENECK
            }
          ]
        },
        "process_output": {
          "labels": [0, 1, 2, ..., 199],
          "series": [...]
        },
        "utilization": {
          "labels": [0, 1, 2, ..., 199],
          "series": [...]
        }
      }
    },
    "custom": {
      "summary": { ... },
      "charts": { ... }
    }
  }
}
```

**Chart Data Features**:
- **labels**: Day numbers (aligned across all charts)
- **series**: Array of time series data
- **highlight**: `true` for bottleneck series (visual emphasis)
- **values**: Complete time series (200 data points)

**Bottleneck Detection**:
- **Queue bottlenecks**: High average level, growth streaks, persistent accumulation
- **Process bottlenecks**: High utilization, capacity saturation, output plateaus
- **Confidence score**: 0-1 score based on multiple indicators
- **Time window**: Critical period where bottleneck is most severe


## Architecture

### File Structure

```
medica-scientific/
├── index.js              # STEP 1: Data ingestion entry point
├── analyze.js            # STEP 2: Bottleneck analysis entry point
├── src/
│   ├── parser.js         # Excel parsing logic
│   ├── writer.js         # Chunked file writer
│   ├── analytics.js      # Bottleneck detection engine
│   └── utils.js          # Utility functions
├── file/
│   └── MBA68-BA650.xlsx  # Input Excel file
├── output/               # Generated output
│   ├── meta.json
│   ├── history/
│   ├── standard/         # Standard scenario day files
│   ├── custom/           # Custom scenario day files
│   ├── inventory/
│   ├── financial/
│   ├── workforce/
│   └── frontend/
│       └── bottleneck_dashboard.json  # Dashboard data
├── package.json
└── README.md
```

### Module Breakdown

#### `src/utils.js`
Utility functions for data normalization:
- `normalizeColumnName()`: Converts column names to lowercase with underscores
- `normalizeSheetName()`: Normalizes sheet names to lowercase
- `convertValue()`: Converts cell values to appropriate types (number, string, null)
- `isEmptyColumn()`: Detects empty columns for removal

#### `src/parser.js`
Core parsing logic:
- `loadWorkbook()`: Loads Excel file using xlsx library
- `filterSheets()`: Filters out sheets ending with "-Graphs"
- `parseSheet()`: Converts a sheet to array of normalized row objects
- `parseSimulationData()`: Main orchestrator function

#### `src/writer.js`
Chunked file writer with async operations:
- `ensureDirectory()`: Creates directories idempotently
- `writeMeta()`: Writes meta.json with simulation metadata
- `writeDayChunk()`: Writes individual day files
- `writeHistorySheet()`: Writes history events file
- `writeChunkedOutput()`: Main orchestrator for file writing

#### `src/analytics.js`
Bottleneck detection engine:
- `loadScenarioData()`: Loads day files incrementally
- `extractQueueTimeSeries()`: Dynamically identifies queue metrics
- `extractProcessTimeSeries()`: Dynamically identifies process metrics
- `detectBottleneck()`: Scores and identifies primary bottleneck
- `buildTabPayload()`: Generates frontend-ready chart data
- `analyzeScenario()`: Main orchestrator for scenario analysis

#### `analyze.js`
Analytics runner that:
- Loads simulation metadata
- Analyzes each scenario independently
- Generates bottleneck dashboard JSON
- Reports bottleneck summary

#### `index.js`
Data ingestion entry point that:
- Calls parser to extract data from Excel
- Calls writer to output chunked JSON files
- Reports statistics and handles errors

## Column Name Normalization

Column names are normalized using the following rules:

1. Convert to lowercase
2. Replace spaces and hyphens with underscores
3. Remove special characters (parentheses, periods, etc.)
4. Remove duplicate underscores
5. Trim leading/trailing underscores

**Examples:**
- `"Standard Queue 1-Level"` → `"standard_queue_1_level"`
- `"Orders (Accepted)"` → `"orders_accepted"`
- `"Station 1 Output"` → `"station_1_output"`

## Data Characteristics

The parser handles simulation data with these characteristics:

- **Time Index**: "Day" column represents the primary time index
- **Metrics**: All other columns are simulation metrics
- **Multiple Sheets**: Each sheet represents a subsystem (Standard, Inventory, Financial, etc.)
- **Numeric Data**: Most values are numeric (converted automatically)
- **Empty Cells**: Converted to `null` in JSON output

## Performance Benefits

The chunked output structure provides significant advantages:

### Query Performance
- **Time-Range Queries**: Load only days 50-100 instead of entire dataset
- **Direct Access**: Read specific day without parsing full file
- **Memory Efficient**: Process one day at a time
- **Parallel Loading**: Load multiple days concurrently

### Use Cases
- **Bottleneck Detection**: Analyze queue buildup over specific time windows
- **Throughput Analysis**: Compare station output across day ranges
- **Capacity Utilization**: Track resource usage patterns
- **Dashboard Visualization**: Load data incrementally for Chart.js, D3.js, React
- **Scenario Comparison**: Compare same day across multiple simulations

### Scalability
- **Database Migration**: Easy to import day-by-day into database
- **Streaming**: Process days as they're generated
- **Caching**: Cache frequently accessed day ranges
- **Incremental Updates**: Add new days without rewriting entire dataset

## Error Handling

The parser includes comprehensive error handling:

- File not found errors
- Invalid Excel format errors
- Empty sheet warnings
- Graceful handling of missing/null values

All errors are logged to console with clear messages.

## Dependencies

- **xlsx** (^0.18.5): Excel file parsing library

## License

ISC
