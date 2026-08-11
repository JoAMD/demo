# Phase 3: Split Popover & Features - Context

**Gathered:** 2026-08-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Per-condition split evaluation popover (core differentiator), edge case robustness, export trace as JSON, and stop-on-failure behavior. User clicks split node → sees per-condition breakdown with evaluated values and pass/fail. Failed steps stop flow execution.

</domain>

<decisions>
## Implementation Decisions

### SplitPopover
- **D-01:** Replace existing `SplitPreview` in StepInspector (not floating popover)
- **D-02:** Extend `StepResult` type with `conditionResults: { name: string; value: unknown; passed: boolean }[]`
- **D-03:** Update execution engine `evaluateFilterGroup` to return per-condition results

### Payload Templates
- **D-04:** Auto-match payload to flow trigger event on flow selection (no separate dropdown)
- **D-05:** Flow selector becomes template selector — selecting flow loads matching payload

### Export
- **D-06:** Button with download icon + "Export" label, positioned left of Run Trace in header
- **D-07:** Export payload: `JSON.stringify({ flow, payload, results })` → `.json` download
- **D-08:** SVG icon: `M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3`

### Edge Cases
- **D-09:** Empty payload → show "No payload provided" in trigger step inspector (after run, not before)
- **D-10:** Malformed JSON → inline error in JsonEditor (already implemented)
- **D-11:** Missing contact → skip contact.* merge, show warning (already implemented)

### Stop on Failure
- **D-12:** If step fails (`result.passed === false`), break execution loop — subsequent steps unexecuted
- **D-13:** Unexecuted steps: gray, unclickable in canvas, not in results array
- **D-14:** Split `branchTaken: 'no'` is valid outcome, does NOT stop flow
- **D-15:** Split runtime error → stops flow at that split

### Bug Fix
- **D-16:** Fix `findStep` in StepInspector to include `flow.trigger` (currently only searches `flow.steps`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/ROADMAP.md` — Phase 3 goals, plans, exit criteria, UI theme tokens
- `.planning/PROJECT.md` — Core value ("show why a flow routed"), constraints
- `.planning/REQUIREMENTS.md` — SPLT-01, SPLT-02, SPLT-03, EVT-02 requirements

### Phase 1 & 2 Context
- `.planning/phases/01-foundation-trace-engine/01-CONTEXT.md` — Discriminated union types, execution engine, store
- `.planning/phases/02-trace-ui-inspector/02-CONTEXT.md` — StepInspector, path animation, contact selector

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/types.ts` — Step, Filter, FilterGroup, StepResult types
- `src/engine/executionEngine.ts` — `executeTrace`, `evaluateFilterGroup`, `evaluateFilter`
- `src/store/traceStore.ts` — Zustand store with flow, payload, results, selectedStep
- `src/components/StepInspector.tsx` — Current `SplitPreview` to replace, `findStep` to fix
- `src/components/FlowCanvas.tsx` — Node click handler, executed/active styling
- `src/components/JsonEditor.tsx` — Flow selector, JSON parse error handling
- `src/App.tsx` — Header with Run Trace button, `handleRunTrace`

### Established Patterns
- Discriminated union on `kind` for step types
- `useShallow` on all Zustand selectors
- `React.memo` on custom React Flow nodes
- UI theme tokens: accent=#f97316, success=#22c55e, error=#ef4444

### Integration Points
- `src/engine/types.ts` — Add `conditionResults` to `StepResult`
- `src/engine/executionEngine.ts` — Extend `evaluateFilterGroup` to return per-condition results, add stop-on-failure
- `src/components/StepInspector.tsx` — Replace `SplitPreview`, fix `findStep`, add empty payload message
- `src/App.tsx` — Add Export button in header, auto-match payload on flow change
- `src/components/FlowCanvas.tsx` — No changes needed (unexecuted steps auto-gray via `executedIds`)

</code_context>

<specifics>
## Specific Ideas

- SplitPopover shows both unresolved expression AND resolved value — helps debug why condition passed/failed
- Auto-match payload to flow trigger event — reduces user friction, ensures correct payload schema
- Export includes full context (flow + payload + results) — useful for bug reports, Slack threads
- Stop on failure matches real Nitrosend behavior — flow stops sending on bounce/failure

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 3-Split Popover & Features*
*Context gathered: 2026-08-04*
