# Phase 1: Foundation & Trace Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-04
**Phase:** 1-Foundation & Trace Engine
**Areas discussed:** Type system & store shape, Execution engine semantics, Fixture data shapes, Canvas shell layout

---

## Type System & Store Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Discriminated union | Single Step type with `kind` field — type-safe, matches React Flow pattern | ✓ |
| Separate types + wrapper | EmailStep, SplitStep etc. as separate interfaces with union — more verbose | |

**User's choice:** Discriminated union on `kind` field
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Flat result + branch field | StepResult { stepId, status, branchTaken?, resolvedValues } — one object | ✓ |
| Nested per-type results | SplitResult, EmailResult etc. — richer but harder to render generically | |

**User's choice:** Flat result + branch field
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Single traceStore | One store: { flow, payload, results, status, selectedStep } — flat, simple | ✓ |
| Split stores | flowStore + traceStore + uiStore — more granular, overkill for MVP | |

**User's choice:** Single traceStore
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| useShallow from day one | Use useShallow on all selectors — prevents re-renders on ref changes | ✓ |
| Add later when needed | Plain selectors now, optimize when re-renders visible — premature optimization | |

**User's choice:** useShallow from day one
**Notes:** None

---

## Execution Engine Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| BFS with queue | Standard breadth-first — processes nodes level by level | ✓ |
| DFS with stack | Depth-first — follows one branch fully before backtracking | |

**User's choice:** BFS with queue
**Notes:** Prefer npm package for graph traversal instead of reinventing. Ask before choosing package. Mention in architectural docs.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inline switch/match | Simple switch on predicate type — no runtime deps, easy to extend | ✓ |
| Predicate registry | Map of predicate functions — extensible but more boilerplate | |

**User's choice:** Inline switch/match
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Loose coercion | Coerce to same type before comparing — matches email platform behavior | ✓ |
| Strict typing | No coercion, fail on type mismatch — safer but friction for users | |

**User's choice:** Loose coercion
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pure function | executeTrace(flow, payload) → TraceResult — no state, easy to test | ✓ |
| Class with methods | new TraceEngine(flow).execute(payload) — stateful, extensible | |

**User's choice:** Pure function
**Notes:** User initially questioned if class would be better. Explained: no state between calls, easier to test, matches ROADMAP plan 1.2.

---

## Fixture Data Shapes

| Option | Description | Selected |
|--------|-------------|----------|
| Linear, branching, multi-step | 3-step, 5-step, 8+ steps — covers all exit criteria | ✓ |
| Minimal progressive | 2-step, 3-step, 5-step — simpler but less coverage | |

**User's choice:** Linear, branching, multi-step
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Core events + edge cases | cart_abandoned, signup, purchase, password_reset, subscription_expired | ✓ |
| All from REQUIREMENTS.md | cart_abandoned, signup + profile_updated, order_shipped, re-engagement | |

**User's choice:** Core events + edge cases
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Varied attributes | High/low engagement, different tiers, bounced vs clean, unsubscribed | ✓ |
| Minimal set | 3 contacts with basic fields — simpler but less filter coverage | |

**User's choice:** Varied attributes
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Single fixtures.ts | All flows, payloads, contacts in one file — simple, co-located | |
| Separate files | flows.ts, payloads.ts, contacts.ts — modular, more imports | ✓ |

**User's choice:** Separate files
**Notes:** None

---

## Canvas Shell Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-layout with dagre | Use dagre for top-down auto-layout — clean, handles branches | ✓ |
| Manual positions | Hardcode x/y in flow definitions — more control but brittle | |

**User's choice:** Auto-layout with dagre
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Simple labeled boxes | Rounded rectangles with step name + type icon — clean, matches theme | ✓ |
| Rich cards | Cards with subject preview, status badge — more info but busier | |

**User's choice:** Simple labeled boxes
**Notes:** User initially wanted to see this question again after answering zoom. Confirmed same choice.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fit-to-view + min/max zoom | Auto-fit on load, zoom 0.2–2.0, scroll wheel zoom — standard defaults | ✓ |
| Fixed zoom | 1:1 zoom, pan only — simpler but worse UX for large flows | |

**User's choice:** Fit-to-view + min/max zoom
**Notes:** None

---

## the agent's Discretion

- Graph traversal package choice — agent selects, asks user before locking in
- Exact dagre configuration (rankdir, spacing) — agent decides based on flow complexity

## Deferred Ideas

None — discussion stayed within phase scope
