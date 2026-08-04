# Phase 2: Trace UI & Inspector - Context

**Gathered:** 2026-08-04
**Status:** Ready for planning

<domain>
## Phase Boundary

The debugging UX — step-by-step evaluation log with one-step-at-a-time detail view, animated path highlight on canvas, contact selector auto-merging into payload, and "Run Trace" wiring. User enters payload, picks contact, clicks run, sees results.

</domain>

<decisions>
## Implementation Decisions

### Step Inspector Layout
- **D-01:** 3-column layout: Canvas | Step Inspector | JSON Editor — all panels resizable and closable
- **D-02:** Step inspector shows one step at a time, not a list — detail card view
- **D-03:** Email steps render full email preview (subject + body), full panel height; other steps show smaller content but panel stays full height
- **D-04:** Navigation via click canvas nodes OR prev/next buttons at bottom of inspector
- **D-05:** Empty state before trace runs: "Run a trace to see results"
- **D-06:** Panels closable via toggle button AND draggable resize handles

### Email Preview
- **D-07:** Email steps show rendered preview by default, with option to switch to raw HTML view

### Split Step Display
- **D-08:** Split steps show all conditions — each condition displays unresolved expression AND resolved value

### Path Animation
- **D-09:** Animated dashed line in orange accent color (`#f97316`) for executed path
- **D-10:** Unexecuted steps grayed out using `text-secondary` (`#a1a1aa` / `#71717a`)

### Contact Selector
- **D-11:** Auto-merge contact.* fields into JSON editor payload on selection — single source of truth

### Run Trace Button
- **D-12:** Fixed in header bar, always visible — standard SaaS pattern

### the agent's Discretion
- Exact panel default widths and resize constraints
- Keyboard shortcuts for prev/next navigation
- Animation timing and easing for path highlight
- Error handling for failed traces (loading state, error messages)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/ROADMAP.md` — Phase 2 goals, plans, exit criteria, UI theme tokens (accent=#f97316, success=#22c55e, error=#ef4444, text-secondary=#a1a1aa)
- `.planning/PROJECT.md` — Core value ("show why a flow routed"), constraints (draft-only MVP), out-of-scope items
- `.planning/REQUIREMENTS.md` — CANV-03, CANV-04, EVT-03, INSP-01–04 requirements mapped to Phase 2

### Phase 1 Context
- `.planning/phases/01-foundation-trace-engine/01-CONTEXT.md` — Prior decisions: discriminated union step types (D-01), flat StepResult with branchTaken (D-02), single traceStore with useShallow (D-03, D-04), pure executeTrace function (D-08)

### No external specs
No external ADRs or design docs — requirements fully captured in decisions above and roadmap.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/types.ts` — Step discriminated union, StepResult, Flow, Filter types
- `src/engine/executionEngine.ts` — Pure executeTrace(flow, payload) → TraceResult function
- `src/store/traceStore.ts` — Zustand store with flow, payload, results, status, selectedStep
- `src/components/FlowCanvas.tsx` — React Flow wrapper with dagre auto-layout, StepNode component
- `src/components/JsonEditor.tsx` — Textarea with monospace styling
- `src/mocks/fixtures/` — Sample flows, payloads, contacts

### Established Patterns
- Discriminated union on `kind` for step types — type-safe switching
- `useShallow` on all Zustand selectors — prevents re-renders
- `React.memo` on custom React Flow nodes — performance for large graphs
- UI theme tokens from ROADMAP.md — accent, success, error, text-secondary colors

### Integration Points
- `src/store/traceStore.ts` — Add selectedStep tracking for inspector navigation
- `src/components/FlowCanvas.tsx` — Add path highlight animation, click handler for node selection
- `src/components/JsonEditor.tsx` — Add contact auto-merge, closable panel
- New: `src/components/StepInspector.tsx` — Step detail view with email preview, split breakdown
- New: `src/components/TraceDock.tsx` — 3-panel resizable layout container

</code_context>

<specifics>
## Specific Ideas

- Email preview: rendered by default, toggle to raw HTML — matches real Nitrosend email builder experience
- Split conditions: show both unresolved expression AND resolved value — helps debug why a condition passed/failed
- Orange accent for path animation — matches UI theme, distinct from error red and success green
- Closable panels with both button toggle AND drag resize — power users want keyboard shortcuts, casual users want visual controls

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 2-Trace UI & Inspector*
*Context gathered: 2026-08-04*
