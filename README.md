# Medica Scientific - Production Analytics

Node.js data pipeline and React dashboard for Medica Scientific simulation output. The system ingests Excel exports, writes chunked JSON by day, and runs a bottleneck analysis that feeds a frontend-ready dashboard.

## What This Project Does

- Parse an Excel workbook of simulation results
- Normalize and chunk metrics into day-based JSON files
- Detect bottlenecks with confidence scoring
- Serve a dashboard UI and an upload workflow

## Quick Start

```bash
npm install
```

### Run the pipeline from the CLI

```bash
npm run parse
npm run analyze
```

The parser expects an Excel file at `file/MBA68-BA650.xlsx`.

### Run the upload server + frontend

In one terminal:

```bash
npm run server
```

In another terminal:

```bash
npm run dev
```

Open the UI from the Vite dev server (usually `http://localhost:5173`). Uploading an `.xlsx` file will:

1. Save it to `file/MBA68-BA650.xlsx`
2. Clear previous output
3. Run `npm run parse` and `npm run analyze`
4. Return raw data and do analyze data for the dashboard JSON path

## Output Layout

After parsing, output is written under `output/`:

```
output/
├── meta.json
├── history/
│   └── events.json
├── standard/
│   ├── day_000.json
│   └── ...
├── custom/
│   ├── day_000.json
│   └── ...
├── inventory/
├── financial/
└── workforce/
```

Bottleneck analysis writes a dashboard payload to:

```
output/frontend/bottleneck_dashboard.json
```

## Scripts

- `npm run parse`: Parse the Excel file into chunked JSON
- `npm run analyze`: Generate bottleneck dashboard output
- `npm run server`: Start the upload server on port 3001
- `npm run dev`: Start the Vite frontend
- `npm run build`: Build the frontend
- `npm run preview`: Preview the built frontend

## Project Structure

- `index.js`: CLI entry for parsing
- `analyze.js`: CLI entry for bottleneck analysis
- `server.js`: Upload server (Express + Multer)
- `src/parser.js`: Excel parsing and normalization
- `src/writer.js`: Chunked JSON writer
- `src/analytics.js`: Bottleneck detection + dashboard payload
- `src/pages`: React pages for upload and dashboard
- `src/components`: Reusable UI pieces

## Notes

- Scenario analysis is currently limited to `standard` and `custom`.
- Sheet names are normalized to lowercase; column names are normalized with underscores.
