# Phase 1: Foundation & Trace Engine - Context

**Gathered:** 2026-08-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Core infrastructure — TypeScript types, BFS execution engine, MSW mocks with fixture data, React Flow canvas shell with auto-layout, and JSON editor textarea. Everything compiles and renders; no trace UI yet.

</domain>

<decisions>
## Implementation Decisions

### Type System & Store Shape
- **D-01:** Step types modeled as discriminated union on `kind` field (`kind: 'email' | 'split' | 'webhook' | ...`) — type-safe, matches React Flow node data pattern
- **D-02:** Trace evaluation returns flat `StepResult` with `branchTaken?: 'yes'|'no'` — one object per step, easy to iterate in inspector
- **D-03:** Single Zustand `traceStore` holds `{ flow, payload, results, status, selectedStep }` — flat, matches single-user scope
- **D-04:** Use `useShallow` on all Zustand selectors from day one — prevents re-renders on object reference changes (roadmap risk mitigation)

### Execution Engine Semantics
- **D-05:** BFS traversal with queue — prefer npm package for graph traversal logic (ask user before choosing package)
- **D-06:** Split filter predicates evaluated via inline switch/match on predicate type (eq, neq, gt, lt, contains)
- **D-07:** Loose type coercion in filters — coerce to same type before comparing, matches email platform behavior
- **D-08:** Pure function `executeTrace(flow, payload) → TraceResult` — no state between calls, easy to test

### Fixture Data Shapes
- **D-09:** 3 sample flow definitions: linear (3 steps), branching (5 steps), multi-split (8+ steps)
- **D-10:** 5 event payloads: cart_abandoned, signup, purchase, password_reset, subscription_expired
- **D-11:** 5 test contacts with varied attributes: high/low engagement, different tiers, bounced vs clean, unsubscribed
- **D-12:** Fixture files organized separately: `flows.ts`, `payloads.ts`, `contacts.ts`

### Canvas Shell Layout
- **D-13:** Auto-layout with dagre for top-down node positioning — clean, consistent, handles branches
- **D-14:** Simple labeled boxes for nodes — rounded rectangles with step name + type icon, matches UI theme tokens
- **D-15:** Fit-to-view on load, zoom range 0.2–2.0, scroll wheel zoom — standard React Flow defaults

### the agent's Discretion
- Graph traversal package choice — agent selects, asks user before locking in
- Exact dagre configuration (rankdir, spacing) — agent decides based on flow complexity

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/ROADMAP.md` — Phase 1 goals, plans, exit criteria, API reference (flow structure, step types, UI theme tokens)
- `.planning/PROJECT.md` — Core value, constraints, key decisions, out-of-scope items
- `.planning/REQUIREMENTS.md` — CANV-01, CANV-02, TRCE-01–04, EVT-01 requirements mapped to Phase 1

### No external specs
No external ADRs or design docs — requirements fully captured in decisions above and roadmap.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing source code — this is the first phase, building from scratch

### Established Patterns
- React 18 + TypeScript + Vite + Tailwind — company standard stack
- `@xyflow/react` for canvas — purpose-built node/edge editor
- MSW for API mocking — same mocks work in dev and tests
- Zustand for state — flat API, avoids prop drilling

### Integration Points
- `src/` directory to be created — no existing structure
- React Flow canvas connects to traceStore for flow data
- JSON editor textarea connects to traceStore for payload input
- MSW handlers mock `/api/flows/{id}/trace` endpoint

</code_context>

<specifics>
## Specific Ideas

- Graph traversal: prefer npm package over custom BFS implementation (ask before choosing)
- UI theme tokens from ROADMAP.md API reference section must be applied to canvas styling
- Execution engine must match live evaluator semantics — stub with mock logic, real parity validated in Phase 2

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-Foundation & Trace Engine*
*Context gathered: 2026-08-04*
