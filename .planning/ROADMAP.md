# Roadmap: Event Stream & Flow Execution Simulator

**Created:** 2026-08-03
**Granularity:** Coarse (3 phases)
**Core Value:** Show **why** a flow routed the way it did, before it sends.

## Phase 1: Foundation & Trace Engine

**Goal:** Core infrastructure — types, execution engine, MSW mocks, React Flow canvas shell, JSON editor. Everything compiles and renders; no trace UI yet.

**Requirements covered:** CANV-01, CANV-02, TRCE-01, TRCE-02, TRCE-03, TRCE-04, EVT-01

**Plans:**

| Plan | PLAN.md | Description | Dependencies |
|------|---------|-------------|--------------|
| 1.1 Types & Store | `01-01-PLAN.md` | TypeScript types for flow graph, step results, trace state. Zustand store. | None |
| 1.2 Execution Engine | `01-02-PLAN.md` | BFS flow graph evaluator — pure function, no React. Handles trigger, wait, split, email nodes. | 1.1 |
| 1.3 MSW Handlers & Fixtures | `01-03-PLAN.md` | Mock `/api/flows/{id}/trace` endpoint. Fixtures: 3 sample flow definitions (linear, branching, multi-step), 5 event payloads (cart_abandoned, signup, etc.), 5 test contacts with varied attributes (engagement_rating, tier, bounced, unique_opos, unsubscribed_at). | 1.1 |
| 1.4 Canvas Shell + App Shell | `01-04-PLAN.md` | React Flow wrapper with dagre auto-layout, main.tsx MSW worker startup, App.tsx flex layout with FlowCanvas + JsonEditor, default flow fixture loads into store on mount. | 1.1, 1.3 |
| 1.5 JSON Editor | `01-05-PLAN.md` | Textarea with monospace styling. Controlled input for event payload. Run Trace button calls executeTrace. | 1.1, 1.2 |

**Exit criteria:**
- Flow graph renders in canvas (React Flow)
- JSON editor accepts payload
- "Run Trace" button calls MSW mock, returns step results
- Types are consistent across all components

**Risk:** Execution engine must match live evaluator semantics. Stub with mock logic; real parity validated in Phase 2.

---

## Phase 2: Trace UI & Inspector

**Goal:** The debugging UX — step-by-step evaluation log, path highlight on canvas, contact selector, "Run Trace" wiring.

**Requirements covered:** CANV-03, CANV-04, EVT-03, INSP-01, INSP-02, INSP-03, INSP-04

**Plans:**

| Plan | PLAN.md | Description | Dependencies |
|------|---------|-------------|--------------|
| 2.1 Step Inspector + Layout | `02-01-PLAN.md` | StepInspector detail view (PASS/FAIL, email preview, split conditions), TraceDock 3-panel resizable layout, Run Trace in header | 1.2, 1.4 |
| 2.2 Path Highlight + Node Click | `02-02-PLAN.md` | Animated orange dashed path on canvas, node click → inspector jump, active/unexecuted node styling | 1.4, 2.1 |
| 2.3 Contact Selector | `02-03-PLAN.md` | Dropdown with 5 test contacts, auto-merge contact.* fields into payload, header integration | 1.5, 2.1 |

**Exit criteria:**
- User can enter payload, pick contact, click "Run Trace"
- Canvas shows animated path of executed nodes
- Step inspector shows per-step results with PASS/FAIL
- Clicking a canvas node highlights corresponding step in inspector

**Risk:** Path highlight animation performance on large graphs. Mitigate with `React.memo` on custom nodes and `useShallow` selectors from day one.

---

## Phase 3: Split Popover & Features

**Goal:** The killer differentiator — per-condition split evaluation popover. Plus essential robustness.

**Requirements covered:** SPLT-01, SPLT-02, SPLT-03, EVT-02

**Plans:**

| Plan | Description | Dependencies | Audit Notes |
|------|-------------|--------------|-------------|
| 3.1 Split Popover | Per-condition drill-down: expression, evaluated values, PASS/FAIL, suggestion. | 2.1 | **Keep.** Core value prop. |
| 3.2 Sample Templates | Pre-built payload templates for common events (cart_abandoned, etc.). | 1.5 | **Simplify.** Add 2-3 templates as fixture objects in the JSON editor default value. Not a separate plan — just pick good defaults. |
| 3.3 Edge Cases | Handle empty payloads, missing contacts, malformed JSON, large graphs. | All | **Scopen down.** Fix: (1) malformed JSON → inline error, (2) missing contact → skip contact fields, (3) empty payload → show message. Skip "large graphs" — not a realistic debug scenario. |
| 3.4 Branch Override (Sandbox) | Toggle to force trace down "wrong" branch. Yellow SANDBOX badge. Verify other email's content without editing filters. | 2.4, 3.1 | **Drop.** Over-engineered for v1. The split popover already shows what each branch evaluates to. Branch override is a v2 feature if users request it. |
| 3.5 Export Trace as JSON | Button to download full trace state as stable JSON schema. For bug reports, PRs, Slack threads. | 2.4 | **Keep but scope down.** `JSON.stringify` the trace result, save as `.json`. No schema versioning or import — just a dump. |

**Exit criteria:**
- Clicking split node opens popover with per-condition breakdown
- Popover shows actual values and suggests fixes for failed conditions
- No crashes on edge cases (empty payload, missing contact, malformed JSON)
- Export button downloads trace as JSON

**Risk:** Split condition evaluation must match Nitrosend's actual filter syntax (AND/OR groups, type coercion). Validate against real flow definitions.

---

## Phase 4: UI Polish & Professional Styling

> **Before starting:** Request screenshots from user — (a) target design reference (e.g. the Nitrosend flow builder screenshot) and (b) current app state. Compare to define concrete polish scope.

**Goal:** Visual consistency and hierarchy. Tailwind class tweaks, not new components.

**Requirements covered:** UI-01, UI-02, UI-03, UI-04, UI-05

**Plans:**

| Plan | Description | Dependencies |
|------|-------------|--------------|
| 4.1 Header Redesign | Flow name display, status badge (Draft/Live), action buttons (run trace, export). | 2.1, 2.4 |
| 4.2 Node Styling | Colored backgrounds by type (trigger=orange, email=blue, split=purple, webhook=green), icons, rounded cards, subtle shadows. | 1.4 |
| 4.3 Color & Typography Pass | Refine palette for contrast (WCAG AA), font scale, line heights, spacing consistency. Existing Tailwind tokens. | None |

**Exit criteria:**
- Header matches professional SaaS tool aesthetic
- Nodes visually distinct by type with icons and colors
- Color palette passes WCAG AA contrast checks
- Typography creates clear visual hierarchy

**Risk:** Over-polishing can delay core features. Keep scope tight — visual consistency, not redesign. Reuse existing Tailwind tokens where possible.

---

## Phase Summary

| Phase | Status | Requirements | Plans |
|-------|--------|-------------|-------|
| 1: Foundation & Trace Engine | ✓ | 7 | 5 |
| 2: Trace UI & Inspector | ○ | 7 | 3 |
| 3: Split Popover & Features | ○ | 4 | 3 |
| 4: UI Polish & Professional Styling | ○ | 5 | 3 |
| **Total** | | **23** | **14** |

---

## Design Decision: Polish Phase Ordering

**Question:** Should Phase 4 (UI Polish) move to Phase 2?

**Recommendation:** Keep Phase 4 at the end. This is a debug tool — features and correctness matter more than polish early. Moving polish up risks two things: (1) polishing code/structure you might delete or rework after Phase 3 changes the UI, and (2) spending tokens on visual detail before the functional shape is stable. A minimal visual pass during Phase 1 (just enough that components render with correct layout and aren't broken) is sufficient.

**Tradeoffs:**
- **Pro early polish:** Agents see a "finished-looking" UI while building, which can anchor better decisions about spacing/layout.
- **Pro late polish:** No wasted effort on styles that get reworked; polish against the final functional surface; avoids scope creep into "make it pretty" during core phases.
- **Net:** Debug tool → ship features first, polish last. Phase 1 already has basic Tailwind — that's enough visual guardrails.

---

## API Reference (from live flows)

**Flow structure:**
```typescript
{
  id: number
  name: string
  status: "draft" | "live"
  trigger: { event: string, action_name: string, contact_list_id?: number }
  steps: Step[]
}
```

**Step types:**
| Type | Key fields |
|------|-----------|
| email | subject, body, design.sections[], template_id |
| split | filters[{name, value, predicate}], yes: Step[], no: Step[] |
| webhook | url, method, headers |
| sms | (to be confirmed) |
| emit_event | (to be confirmed) |
| subscribe/unsubscribe | (to be confirmed) |
| enrich/verify | (to be confirmed) |

**Split filter predicates:** `eq`, `neq`, `gt`, `lt`, `contains` (TBD — need more examples)

**UI theme:**

| Token | Dark mode | Light mode |
|-------|-----------|------------|
| bg-primary | `#0f0f0f` | `#f5f5f5` |
| bg-sidebar | `#1a1a1a` | `#ffffff` |
| bg-card | `#1e1e1e` | `#ffffff` |
| border-card | `#2a2a2a` | `#e5e5e5` |
| text-primary | `#ffffff` | `#18181b` |
| text-secondary | `#a1a1aa` | `#71717a` |
| accent | `#f97316` | `#f97316` |
| success | `#22c55e` | `#22c55e` |
| error | `#ef4444` | `#ef4444` |
| radius-card | `8px` | `8px` |
| radius-button | `6px` | `6px` |

**Status badge colors:** New = blue, Beta = orange, Soon = gray

---
*Roadmap created: 2026-08-03*
*Last updated: 2026-08-04 — Phase 2 planned (3 plans). Total plans: 15→14.*
