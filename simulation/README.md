# Simulation

File-based factory simulation with two runnable entry points:
- `standard.js` for operations flow + service level summary.
- `finance-report.js` for operations flow + revenue/cost summary.

## Files
- `config.js`: shared configuration and shared initial state.
- `standard.js`: production flow + service level summary.
- `finance-report.js`: production flow + revenue/cost summary.
- `inventory-analyzer.js`: inventory helper (if used separately).

## Run
```bash
node standard.js
node finance-report.js
node inventory-analyzer.js
```

## Configure
Update values in `config.js`:
- `totalDays`
- `inventory` (lead time, reorder rules, costs)
- `standardLine` (order amount/frequency, batch sizes)
- `capabilities` (capacity, machines, market price)

## Initial State (Shared)
The starting state is defined in `config.js` via `config.initialState()`.
Edit this if you want different starting WIP, inventory, or queues.

## Notes
- `orderFrequency` controls the interval of accepted orders.
- Both simulators read the same config for consistency.
