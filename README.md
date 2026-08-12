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

- **Flow canvas** — Visualize flow graphs with React Flow, auto-layout via dagre
- **Trace dock** — 3-pane resizable layout (canvas, inspector, editor)
- **JSON editor** — Enter event payloads
- **Contact selector** — Dropdown populates payload fields from fixture data
- **Step inspector** — Per-step evaluation log with PASS/FAIL pills, Liquid template preview
- **Run trace** — Execute flow against payload, see step results
- **Mock execution engine** — Evaluates conditions, resolves Liquid templates, tracks pass/fail
- **MSW mocks** — API responses mocked for development
- **Export** — Download trace JSON for debugging or sharing
- **Edge highlighting** — Selected path glows, unexecuted nodes dimmed

## Future Work

- Wait step timeline — visualize duration with entry/exit times and timezone conversion
- Activity history — last 10 traces, replay from header without re-entering payload
- Liquid resolution detail — source path, fallback detection, nested access walk
- Sandbox branch override — force trace down specific split branch
- Cross-flow emit_event tracing — multi-flow connected traces
- Export re-import — JSON schema v2 for round-trip support

## Tech Stack

- React 18 + TypeScript
- Vite (build)
- Tailwind CSS v4 (styling)
- @xyflow/react (flow canvas)
- @dagrejs/dagre (graph layout)
- liquidjs (template resolution)
- lucide-react (icons)
- MSW (API mocking)
- Zustand (state management)
- Vitest (testing)
