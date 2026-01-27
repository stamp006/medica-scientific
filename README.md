# Medica Scientific

This project ingests Medica Scientific Excel simulation output, parses it into chunked JSON, analyzes bottlenecks, and serves a frontend dashboard.

The backend pipeline has been refactored into **Clean Architecture** using **Node.js + TypeScript**. Uploads now execute the full pipeline via services and a single use case, with no shell execution and no legacy scripts.

## How It Works

On every `POST /upload`:

1. The uploaded `.xlsx` file is saved to `file/` using its original filename.
2. All prior parsed/analyzed output is deleted.
3. The Excel file is parsed into chunked JSON output.
4. Bottleneck analysis runs against the parsed output.
5. The API returns:

```json
{
  "success": true,
  "outputFile": "output/frontend/bottleneck_dashboard.json"
}
```

## Quick Start

Install dependencies:

```bash
npm install
```

Run the backend server:

```bash
npm run server
```

Run the frontend (in a second terminal):

```bash
npm run dev
```

The frontend typically runs at `http://localhost:5173` and the backend at `http://localhost:3001`.

## API

### `POST /upload`

- Content type: `multipart/form-data`
- Field name: `file`
- Supported file type: `.xlsx`

Successful response:

```json
{
  "success": true,
  "outputFile": "output/frontend/bottleneck_dashboard.json"
}
```

## Scripts

- `npm run build:backend`: Compile the backend TypeScript into `dist/`
- `npm run server`: Build the backend and start the server on port `3001`
- `npm start`: Start the compiled backend from `dist/backend/server.js`
- `npm run dev`: Start the Vite frontend dev server
- `npm run build`: Build the frontend
- `npm run preview`: Preview the built frontend

## Backend Architecture

The backend follows Clean Architecture boundaries:

```text
backend/
  presentation/
    upload.controller.ts
    upload.routes.ts
  application/
    uploadAndAnalyze.usecase.ts
  domain/
    services/
      IUploadService.ts
      IParseService.ts
      IAnalyzeService.ts
  infrastructure/
    services/
      upload.service.ts
      parse.service.ts
      analyze.service.ts
    filesystem/
      fileRepository.ts
      outputRepository.ts
  server.ts
```

Key rules:

- The **use case** (`uploadAndAnalyze.usecase.ts`) is the only orchestrator.
- The controller contains no business logic.
- All previous output is deleted before parsing.
- No `child_process` usage and no shell command execution.

## Output Layout

Pipeline output is written under `output/`:

```text
output/
  meta.json
  history/events.json
  standard/day_000.json
  custom/day_000.json
  inventory/day_000.json
  financial/day_000.json
  workforce/day_000.json
  frontend/bottleneck_dashboard.json
```

The frontend consumes:

- `output/frontend/bottleneck_dashboard.json`

## Data + Analysis Modules

Core parsing and analysis logic remains in:

- `src/parser.js`
- `src/writer.js`
- `src/analytics.js`

These are invoked by TypeScript infrastructure services.

## Notes

- Scenario analysis is currently limited to `standard` and `custom`.
- Sheet names are normalized to lowercase; column names are normalized with underscores.
