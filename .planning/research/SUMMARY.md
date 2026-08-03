# Project Research Summary

**Project:** Event Stream & Flow Execution Simulator
**Domain:** Flow debugging / automation simulator for email/SMS platforms
**Researched:** 2026-08-03
**Confidence:** HIGH

## Executive Summary

This is a step debugger for event-driven automations — think Chrome DevTools for lifecycle flows. Users provide a JSON event payload and contact profile, run a trace, and see exactly which path a flow would take, why each condition passed/failed, and what Liquid variables resolve to. Every major platform (Klaviyo, Braze, Customer.io) has some form of flow preview, but none combine path tracing + per-condition evaluation + variable resolution in a single unified view. That's the gap.

The recommended approach is a three-layer client-side stack: React Flow canvas for visual flow rendering, a pure BFS execution engine that evaluates the flow graph against the payload, and a 3-pane trace dock for inspection. Zustand holds execution state. MSW mocks the trace endpoint. The simulator calls into the real evaluation endpoint (not a re-implementation) — this is non-negotiable for user trust.

The critical risk is **simulated-live execution divergence**: if the simulator shows "Branch A" but the live executor takes "Branch B," users lose trust and never come back. Prevention: share the evaluation engine, pin Liquid versions, and cross-validate against real test sends. Performance is the second risk — React Flow re-render cascades on trace state updates. Prevention: memo everything from day one, use SVG `<animateMotion>` for trace paths, collapse hidden nodes.

## Key Findings

### Recommended Stack

React 18 + TypeScript + Vite + Tailwind CSS (company standard). Three new dependencies: `@xyflow/react` for the flow canvas, `liquidjs` for Shopify-compatible template resolution, and `msw` v2 for API mocking. JSON editing uses a plain `<textarea>` for V1 (Monaco is 30MB+), upgrading to `json-edit-react` in V2. State management is Zustand — flat API, no Redux boilerplate for what's essentially local page state.

**Core technologies:**
- `@xyflow/react`: Node/edge flow canvas with animated trace paths via custom edges
- `liquidjs`: Browser-compatible Liquid template parser (only viable option)
- `msw` v2: Network-layer API mocking (same mocks in dev, tests, Storybook)
- Zustand: Lightweight state management for trace execution state
- `json-edit-react`: Zero-dependency JSON editor upgrade path (V2)

### Expected Features

**Must have (table stakes):**
- Flow canvas rendering — every competitor shows this
- JSON event payload editor with sample templates — cold-start problem
- Contact/profile selection — populates `contact.*` fields for evaluation
- Step-by-step evaluation log with PASS/FAIL status pills
- Path highlight on canvas (animated blue line synced with inspector)
- "Run Trace" without sending — the entire point of the tool

**Should have (competitive):**
- Split evaluation popover — shows *why* each condition passed/failed (killer differentiator)
- Liquid variable resolution with source path — shows resolved value + key location
- Branch override / sandbox mode — force trace down "wrong" branch for testing
- Wait step timeline visualization — converts black-box delays into visible schedule
- Export trace as JSON — share in bug reports, attach to PRs

**Defer (v2+):**
- Trace diff between runs
- Recent webhook auto-fill
- Full Liquid path-walking
- Cross-flow emit_event tracing

### Architecture Approach

Three-layer stack with unidirectional data flow: event payload → execution engine → step results → canvas overlay + dock. The execution engine is a pure BFS evaluator (no React dependency) that traverses the flow graph, evaluating splits, resolving Liquid, and producing `StepResult[]`. MSW intercepts POST `/api/flows/{id}/trace` and returns pre-built trace responses from fixtures. Canvas and dock are siblings reading independently from Zustand — no prop drilling between them.

**Major components:**
1. `FlowCanvas.tsx` — React Flow wrapper, custom nodes, trace path animation
2. `TraceDock.tsx` — 3-pane layout (JSON editor, step inspector, split popover)
3. `executionEngine.ts` — Pure BFS evaluator, split condition resolution, Liquid tags
4. `mocks/handlers.ts` — MSW handlers for trace endpoint
5. Zustand store — Execution state (stepResults, activeStep, tracePath)

### Critical Pitfalls

1. **Simulated-Live Execution Divergence** — The #1 credibility killer. Simulator must call the real evaluation endpoint, not re-implement logic. Cross-validate against real test sends. Pin Liquid engine version.
2. **React Flow Re-render Cascade** — Each trace update re-renders all nodes. Wrap every custom node in `React.memo`, use Zustand `useShallow`, SVG `<animateMotion>` over stroke-dasharray, collapse hidden sub-trees.
3. **Liquid Resolution Edge Cases** — `nil` renders as empty string, not error. Track resolution metadata (fallback_applied, path_walked). Show warnings for nil/empty resolutions.
4. **Mock Fixture Drift** — Fixtures hand-authored from spec examples drift from production. Record from real API responses, version-pin, add nightly contract checks.
5. **Split Condition Re-implementation Drift** — String vs number coercion, short-circuit evaluation, AND/OR grouping differences. Trace endpoint MUST be the single evaluation engine.

## Implications for Roadmap

### Phase 1: Foundation & Trace Engine
**Rationale:** Pure data/logic layer. No UI, easy to test, parallelizable. Gets the hardest correctness problem right from day one.
**Delivers:** Types, Zustand store, MSW handlers + fixtures, execution engine (BFS evaluator), basic split condition resolution.
**Addresses:** JSON event payload editor (textarea), "Run Trace" button, step-by-step evaluation log (data layer).
**Avoids:** Pitfall #1 (execution divergence) and #5 (split re-implementation) by establishing the trace endpoint as single source of truth.
**Research flags:** Needs research — trace endpoint response shape (what does real `/api/flows/{id}/trace` return?).

### Phase 2: Flow Canvas & Visual Trace
**Rationale:** Canvas and dock can be built in parallel (Phase 2+3 are independent). Canvas is the visual anchor — users need to see the flow before they can debug it.
**Delivers:** React Flow canvas, custom node types (Trigger, Wait, Split, Email), animated trace path overlay, node highlighting synced with active step.
**Uses:** `@xyflow/react`, custom edges with SVG `<animateMotion>`, Zustand store for `tracePath`.
**Implements:** `FlowCanvas.tsx`, `AnimatedTraceEdge.tsx`, custom node components.
**Avoids:** Pitfall #2 (re-render cascade) — memo everything from day one, collapse hidden nodes, cap viewport zoom.
**Research flags:** Skip — React Flow is well-documented with established patterns.

### Phase 3: Trace Dock & Inspector
**Rationale:** Parallel to Phase 2. The dock is where users actually read trace results — the "why did it route here?" value emerges here.
**Delivers:** 3-pane dock layout, JSON editor (textarea + monospace), step inspector with PASS/FAIL pills, sample payload templates.
**Uses:** `liquidjs` for variable resolution display, Zustand for `stepResults` and `activeStep`.
**Implements:** `TraceDock.tsx`, `JsonEditor.tsx`, `StepInspector.tsx`.
**Avoids:** Pitfall #9 (invalid JSON silently accepted) — parse on change, disable button on error, provide templates.
**Research flags:** Skip — standard React patterns.

### Phase 4: Integration & Wiring
**Rationale:** This is where the debugger comes alive. "Run Trace" button triggers engine, results flow to both canvas and dock simultaneously.
**Delivers:** "Run Trace" button wiring, `tracePath` → edge animation, `activeStep` → node highlight, `stepResults` → StepInspector rendering.
**Uses:** All prior phases connected through Zustand store.
**Implements:** The data flow: payload → engine → results → canvas + dock.
**Avoids:** Pitfall #7 (dock fights canvas for space) — default 30% dock height, minimum 40% canvas, resizable.
**Research flags:** Skip — integration patterns are standard.

### Phase 5: Polish & Differentiators
**Rationale:** The debugging loop works. Now add the features that make users say "why doesn't our current tool do this?"
**Delivers:** Split evaluation popover (per-condition drill-down), contact selector (dropdown + auto-fill), Liquid variable resolution display, branch override / sandbox mode, wait step timeline.
**Uses:** `liquidjs` for resolution metadata, Zustand for `splitEvaluation`.
**Implements:** `SplitPopover.tsx`, `ContactSelector.tsx`, enhanced `StepInspector.tsx`.
**Avoids:** Pitfall #3 (silent nil resolution) — track fallback metadata, show warnings, test edge cases. Pitfall #8 (stale contact data) — fresh fetch on every run.
**Research flags:** Needs research — split condition evaluation display order (evaluated order vs authoring order).

### Phase Ordering Rationale

- **Phase 1 first** because the trace engine is the correctness foundation. Everything depends on it. Get it right before building UI.
- **Phases 2+3 parallel** because canvas and dock are independent siblings reading from the same Zustand store. No coupling between them.
- **Phase 4 after 2+3** because integration requires both visual and inspector components to wire together.
- **Phase 5 last** because differentiators are polish, not blockers. Ship the debugging loop first, then earn the "why this wins" argument.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Trace endpoint response shape — what does the real `/api/flows/{id}/trace` return? Need to record actual response from Nitrosend API.
- **Phase 5:** Split condition evaluation order — display conditions in evaluated order or authoring order? Needs UX decision.

Phases with standard patterns (skip research-phase):
- **Phase 2:** React Flow is well-documented with established patterns.
- **Phase 3:** Standard React component patterns.
- **Phase 4:** Standard integration/wiring patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are well-documented, company standard, purpose-built for this use case |
| Features | HIGH | Competitive landscape thoroughly surveyed, clear table stakes vs differentiators |
| Architecture | HIGH | Three-layer pattern is proven, React Flow + Zustand is a well-documented combination |
| Pitfalls | HIGH | Sourced from official docs, community benchmarks, and production debugging patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **Trace endpoint response shape:** Phase 1 needs the actual API response schema. Record from real `nitro_compose_flow` or `nitro_send_test_message` responses. Don't hand-author from spec examples.
- **Liquid engine version parity:** Pin simulator's liquidjs version to exact production version. Verify behavior matches Shopify Liquid for edge cases (nil handling, default filter, strict_variables).
- **Contact data freshness:** Decision needed — fetch on every trace run (fresh but slower) vs cache with TTL (faster but stale). MVP should fetch fresh.
- **Dock layout on small screens:** Responsive behavior needs design decision — vertical stacking vs tabbed interface on < 768px.

## Sources

### Primary (HIGH confidence)
- reactflow.dev — React Flow official docs, performance optimization, custom nodes/edges
- liquidjs.com — Liquid template engine docs, Shopify compatibility
- mswjs.io — MSW v2 API mocking, handler patterns
- zustand.docs.pmndrs — Zustand state management patterns

### Secondary (MEDIUM confidence)
- Klaviyo flow preview docs — Competitive analysis, profile preview patterns
- Braze Canvas test paths — Test Canvas, experiment path debugging
- Customer.io journey builder — Branch visualization, queue drafts
- React Flow community benchmarks — Performance optimization patterns

### Tertiary (LOW confidence)
- flow-engine-hr, AgentHub, VizLang — GitHub examples of React Flow + Zustand combinations
- Liquid GitHub issues (#749, #1404) — Edge case behavior documentation
- adhdecode.com — Event-driven architecture testing pitfalls

---
*Research completed: 2026-08-03*
*Ready for roadmap: yes*
