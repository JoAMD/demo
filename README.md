# Nitrosend Flow Execution Simulator

Step debugger for Nitrosend lifecycle automations — see why a flow routed the way it did, before it sends.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests (Vitest) |

## What It Does

- **Flow canvas** — Visualize flow graphs with React Flow
- **JSON editor** — Enter event payloads
- **Run Trace** — Execute flow against payload, see step results
- **MSW mocks** — API responses mocked for development

## Tech Stack

- React 18 + TypeScript
- Vite (build)
- @xyflow/react (flow canvas)
- MSW (API mocking)
- Zustand (state)
