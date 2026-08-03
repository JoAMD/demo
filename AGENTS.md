# Agent Instructions

## Project

Event Stream & Flow Execution Simulator — step debugger for Nitrosend lifecycle automations.

## Tech Stack

- React 18 + TypeScript
- Vite (build)
- Tailwind CSS (styling)
- @xyflow/react (flow canvas)
- MSW (API mocking)
- Zustand (state management)
- liquidjs (Liquid template resolution — V2)

## Conventions

- TypeScript strict mode
- Functional components only (no class components)
- Zustand for shared state, React state for local
- MSW for all API mocking (no manual fetch mocking)
- `React.memo` on custom React Flow nodes
- `useShallow` for Zustand selectors to prevent unnecessary re-renders

## File Structure

```
src/
  components/
    FlowCanvas.tsx       ← React Flow wrapper, trace path animation
    TraceDock.tsx        ← bottom dock, 3-pane layout
    JsonEditor.tsx       ← textarea + monospace styling
    StepInspector.tsx    ← per-step evaluation log, PASS/FAIL pills
    SplitPopover.tsx     ← condition drill-down (V1: stub, V2: full)
    ContactSelector.tsx  ← contact dropdown, auto-populates fields
  store/
    traceStore.ts        ← Zustand store for trace state
  engine/
    executionEngine.ts   ← BFS flow graph evaluator (pure function)
    types.ts             ← TypeScript types for flow graph, steps, results
  mocks/
    handlers.ts          ← MSW handlers for /api/flows/{id}/trace
    fixtures/            ← sample flow drafts + trace response payloads
```
