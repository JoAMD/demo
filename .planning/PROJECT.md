# Event Stream & Flow Execution Simulator

## What This Is

A step debugger for Nitrosend lifecycle automations. Developers and lifecycle ops engineers can replay an event payload through a draft flow, see exactly which branch each split took, inspect Liquid variable resolutions, and trace downstream emit_event chains — all without sending a real message.

## Core Value

Show **why** a flow routed the way it did, before it sends. If the simulator can't answer "why did Sam Chen get Branch B?", it fails.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Render flow draft as interactive canvas (React Flow)
- [ ] Bottom-dock trace panel with 3-pane layout (JSON editor, step inspector, path highlight)
- [ ] JSON editor with sample payload templates
- [ ] Step-by-step evaluation log with PASS/FAIL per condition
- [ ] Per-condition split popover showing why each condition passed/failed
- [ ] Path highlight overlay on canvas (animated trace line)
- [ ] Contact selector to populate contact.* fields
- [ ] "Run Trace" button that evaluates draft without sending
- [ ] Read-only /trace endpoint (or mock) that re-runs flow graph deterministically

### Out of Scope

- Cross-flow emit_event chain tracing — MVP is draft-only, one flow at a time
- Sandbox branch override — defer to V2
- Wait-step timeline visualization — defer to V2
- Trace export/import — defer to V2
- Liquid tag drill-down with full path-walking — V1 shows resolved values only
- Monaco editor — use textarea, Monaco is 30MB+
- Real-time collaboration — single-user debug tool

## Context

- Part of the Nitrosend email/SMS automation platform
- Existing tool `nitro_send_test_message` verifies content but not path — this fills the gap
- Flow canvas uses `@xyflow/react` (React Flow) for node/edge rendering
- Tech stack: React 18 + TypeScript, Vite, Tailwind CSS, MSW for API mocking
- Plan review verdict: "iterate" — ship draft-only MVP first, expand later
- Real risk: divergence between simulated path and live executor becomes a credibility tax

## Constraints

- **Tech stack**: React 18 + TypeScript, Vite, Tailwind — company standard
- **Scope**: MVP = draft-only trace, no cross-flow, no sandbox, no export
- **Fidelity**: Simulated path must match live executor exactly or users won't trust it
- **Dependencies**: Only `@xyflow/react` and `msw` are new additions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Draft-only MVP first | Full simulator is large; must stay in lockstep with live executor | — Pending |
| textarea over Monaco | Monaco is 30MB+; autocomplete deferred to V2 | — Pending |
| React Flow for canvas | Purpose-built node/edge editor with zoom, pan, animated paths | — Pending |
| MSW for mocking | Same mocks work in Storybook, dev, and future tests | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-03 after initialization*
