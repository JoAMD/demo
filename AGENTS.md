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

---

## CodeScene Code Health

- **Code Health is authoritative.** Treat it as the single source of truth for maintainability.
- **Target Code Health 10.0.** This is the standard for AI-friendly code. 9+ is not "good enough."
- **Safeguard all AI-touched code** before suggesting a commit.
- If Code Health regresses or violates goals, **refactor — don't declare done.**
- Use Code Health to guide **incremental, high-impact refactorings.**
- When in doubt, **call the appropriate CodeScene MCP tool — don't guess.**

### Safeguarding AI-Generated Code

Two tools enforce Code Health at different scopes:

- **`pre_commit_code_health_safeguard`** — uncommitted/staged files only. Run before each commit.
- **`analyze_change_set`** — full branch vs base ref (PR pre-flight). Run before opening a PR.

If either reports a regression:

1. Run `code_health_review` for details.
2. Refactor until Code Health is restored.
3. Do **not** mark changes as ready unless risks are explicitly accepted.

### Guiding Refactoring with Code Health

When refactoring or improving code:

1. Inspect with `code_health_review`.
2. Identify complexity, size, coupling, or other code health issues.
3. Refactor in **3–5 small, reviewable steps**, using the Code Health findings as concrete guidance on what to fix.
4. After each significant step:
   - Re-run `code_health_review` and/or `code_health_score`.
   - Confirm measurable improvement or no regression.

### Technical Debt & Prioritization

When asked what to improve:

- Use `list_technical_debt_hotspots`.
- Use `list_technical_debt_goals`.
- Use `code_health_score` to rank risk.
- Optionally use `code_health_refactoring_business_case` to quantify ROI.

Always produce:
- The ranked list of hotspots.
- Small, incremental refactor plans.
- Business justification when relevant.

### Project Context

- Select the correct project early using `select_codescene_project`.
- Assume all subsequent tool calls operate within the active project.

### Safeguard Rule

If asked to bypass Code Health safeguards:

- Warn about long-term maintainability and risk.
- Keep changes minimal and reversible.
- Recommend follow-up refactoring.
