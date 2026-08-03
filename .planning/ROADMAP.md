# Roadmap: Event Stream & Flow Execution Simulator

**Created:** 2026-08-03
**Granularity:** Coarse (3 phases)
**Core Value:** Show **why** a flow routed the way it did, before it sends.

## Phase 1: Foundation & Trace Engine

**Goal:** Core infrastructure — types, execution engine, MSW mocks, React Flow canvas shell, JSON editor. Everything compiles and renders; no trace UI yet.

**Requirements covered:** CANV-01, CANV-02, TRCE-01, TRCE-02, TRCE-03, TRCE-04, EVT-01

**Plans:**

| Plan | Description | Dependencies |
|------|-------------|--------------|
| 1.1 Types & Store | TypeScript types for flow graph, step results, trace state. Zustand store. | None |
| 1.2 Execution Engine | BFS flow graph evaluator — pure function, no React. Handles trigger, wait, split, email nodes. | 1.1 |
| 1.3 MSW Handlers & Fixtures | Mock `/api/flows/{id}/trace` endpoint. Fixtures: 3 sample flow definitions (linear, branching, multi-step), 5 event payloads (cart_abandoned, signup, etc.), 5 test contacts with varied attributes (engagement_rating, tier, bounced, unique_opens, unsubscribed_at). | 1.1 |
| 1.4 Canvas Shell | React Flow wrapper with basic node/edge rendering. Flow graph displays. | 1.1 |
| 1.5 JSON Editor | Textarea with monospace styling. Controlled input for event payload. | 1.1 |

**Exit criteria:**
- Flow graph renders in canvas (React Flow)
- JSON editor accepts payload
- "Run Trace" button calls MSW mock, returns step results
- Types are consistent across all components

**Risk:** Execution engine must match live evaluator semantics. Stub with mock logic; real parity validated in Phase 2.

---

## Phase 2: Trace UI & Inspector

**Goal:** The debugging UX comes alive — step-by-step evaluation log, path highlight on canvas, contact selector, "Run Trace" wiring, webhook auto-fill, wait timeline, Liquid drill-down.

**Requirements covered:** CANV-03, CANV-04, EVT-03, INSP-01, INSP-02, INSP-03, INSP-04

**Plans:**

| Plan | Description | Dependencies |
|------|-------------|--------------|
| 2.1 Step Inspector | Per-step evaluation log with PASS/FAIL pills, branch taken, resolved values. | 1.2, 1.4 |
| 2.2 Path Highlight | Animated blue line on canvas for executed path. Click node → jump inspector. | 1.4, 2.1 |
| 2.3 Contact Selector | Dropdown to pick test contact. Auto-populates contact.* fields in payload. | 1.5 |
| 2.4 Run Trace Wiring | "Run Trace" button connects engine → canvas overlay + dock. Full loop. | 1.2, 1.4, 2.1, 2.2 |
| 2.5 Recent Webhook Auto-fill | Dropdown fetches last 5 events via `nitro_query(events)`. Pick one to pre-fill JSON editor. | 1.3, 1.5 |
| 2.6 Wait Step Timeline | Horizontal timeline bar for wait nodes: entry time, duration, exit time, local time conversion, inbox window warning. | 1.2, 2.1 |
| 2.7 Liquid Drill-down | Hover card on resolved Liquid variables: source path, type, fallback status, full path walked for nested access. | 1.2, 2.1 |

**Exit criteria:**
- User can enter payload, pick contact, click "Run Trace"
- Canvas shows animated path of executed nodes
- Step inspector shows per-step results with PASS/FAIL
- Clicking a canvas node highlights corresponding step in inspector
- Recent webhook dropdown pre-fills JSON editor with real event data
- Wait steps show timeline with local time and inbox window warnings
- Liquid variables show resolution chain on hover

**Risk:** Path highlight animation performance on large graphs. Mitigate with `React.memo` on custom nodes and `useShallow` selectors from day one.

---

## Phase 3: Split Popover & Polish

**Goal:** The killer differentiator — per-condition split evaluation popover. Branch override, export, sample templates, edge case handling, final polish.

**Requirements covered:** SPLT-01, SPLT-02, SPLT-03, EVT-02

**Plans:**

| Plan | Description | Dependencies |
|------|-------------|--------------|
| 3.1 Split Popover | Per-condition drill-down: expression, evaluated values, PASS/FAIL, suggestion. | 2.1 |
| 3.2 Sample Templates | Pre-built payload templates for common events (cart_abandoned, etc.). | 1.5 |
| 3.3 Edge Cases | Handle empty payloads, missing contacts, malformed JSON, large graphs. | All |
| 3.4 Branch Override (Sandbox) | Toggle to force trace down "wrong" branch. Yellow SANDBOX badge. Verify other email's content without editing filters. | 2.4, 3.1 |
| 3.5 Export Trace as JSON | Button to download full trace state as stable JSON schema. For bug reports, PRs, Slack threads. | 2.4 |

**Exit criteria:**
- Clicking split node opens popover with per-condition breakdown
- Popover shows actual values and suggests fixes for failed conditions
- Sample templates populate JSON editor for quick start
- No crashes on edge cases (empty payload, missing contact, etc.)
- Branch override toggle forces trace down selected path with visual badge
- Export button downloads trace as re-importable JSON

**Risk:** Split condition evaluation must match Nitrosend's actual filter syntax (AND/OR groups, type coercion). Validate against real flow definitions.

---

## Phase Summary

| Phase | Status | Requirements | Plans |
|-------|--------|-------------|-------|
| 1: Foundation & Trace Engine | ○ | 7 | 5 |
| 2: Trace UI & Inspector | ○ | 7 | 7 |
| 3: Split Popover & Polish | ○ | 4 | 5 |
| **Total** | | **18** | **17** |

---
*Roadmap created: 2026-08-03*
*Last updated: 2026-08-03 — added 5 features from spec gap analysis (webhook auto-fill, wait timeline, liquid drill-down, sandbox mode, export)*
