# Feature Landscape

**Domain:** Flow debugging / automation simulator for email/SMS platforms
**Researched:** 2026-08-03
**Product context:** Nitrosend event-stream flow simulator — step debugger for lifecycle automations

## Competitive Landscape

Surveyed: Klaviyo (flow preview), Braze (Canvas test paths), Customer.io (journey builder + queue drafts), Courier (automation debugger with breakpoints), Yellow.ai (flow debugger with breakpoints), FlowingMail (dry-run mode).

**Key pattern:** Every major platform has *some* form of flow preview/debugging, but none combine path tracing + per-condition evaluation + variable resolution in a single unified view. Most rely on either "send a test message and check inbox" or "pick a profile and see which nodes light up" — neither explains *why* a split took a specific branch.

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Flow canvas rendering** | Every competitor shows the flow graph visually. Without it, debugging is text-only and opaque. | Medium | React Flow handles this. Already decided. |
| **JSON event payload editor** | Users need to define what event triggers the trace. Raw JSON is the only format that matches webhook payloads. | Low | `<textarea>` per spec. Monaco deferred. |
| **Step-by-step evaluation log** | Core debugger UX. Users expect to see each step's result (PASS/FAIL) in sequence. | Medium | Per-step cards with status pills. |
| **Contact/profile selection** | Must populate `contact.*` fields from real or test data. Klaviyo shows "suggested profiles" (last 10 triggers); Braze lets you pick a test user. | Low | Dropdown with search. Auto-populates contact attributes. |
| **Path highlight on canvas** | Users expect to see which nodes the trace visited, not just read a log. Klaviyo highlights visited nodes; Braze shows animated path. | Medium | Animated blue line on canvas, synced with step inspector. |
| **"Run Trace" without sending** | The entire point. Users must be able to evaluate path without side effects. Klaviyo: "Preview"; Braze: "Test Canvas"; Courier: "Debug tab". | Medium | Read-only endpoint, no writes. |
| **Sample payload templates** | Cold-start problem: user opens simulator, sees empty JSON editor, doesn't know what to type. Every platform provides sample events or recent webhooks. | Low | Pre-fill with last 5 webhooks + built-in templates per event type. |

## Differentiators

Features that set product apart. Not expected, but valued. These are where the simulator earns its "why this wins" argument.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Split evaluation popover (per-condition drill-down)** | The killer detail. Shows *why* each condition passed/failed with actual values. No competitor does this at condition level — they only show which branch was taken. | High | Popover on split node: condition expression, left/right values, PASS/FAIL per condition, suggestion for fix. |
| **Liquid variable resolution with source path** | Shows resolved value + which key in which object + whether fallback triggered. Klaviyo shows resolved values but not source paths; Braze resolves Liquid but doesn't expose the walk. | High | Hover card: source path, type, fallback applied, path walked for nested access. |
| **Wait step timeline visualization** | Converts black-box delays into visible schedule audit. Shows entry time, exit time, local timezone, inbox window alignment. No competitor visualizes this. | Medium | Horizontal timeline per wait step with timezone conversion and open-rate window hints. |
| **Branch override / sandbox mode** | Force trace down "wrong" branch to verify other email's content without editing filters. Klaviyo doesn't offer this; Braze lets you pick variant in Experiment Paths but not force a branch. | Medium | Toggle with yellow "SANDBOX" badge. Bypasses split evaluation for selected branch. |
| **Trace diff between runs** | After two traces with different payloads, highlight which conditions changed outcome. Unique differentiator — no competitor offers this. | High | Color-coded: green = same, amber = changed, rose = newly failed. Requires storing previous trace result. |
| **Export trace as JSON** | Share in bug reports, attach to PRs, paste into Slack. Schema-stable for re-import. | Low | JSON download with trace_id, steps, evaluations. |
| **Recent webhook auto-fill** | Pre-fills JSON editor with last N webhooks for this event name. Reduces "what do I type?" friction. | Low | Query `nitro_query` events entity, rank by recency. |

## Anti-Features

Things to deliberately NOT build. These add complexity without proportional value for an MVP debugger.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Monaco editor** | 30MB+ bundle cost for autocomplete we don't need in V1. | `<textarea>` with monospace styling. Add Monaco in V2 if users request autocomplete. |
| **Real-time collaboration** | Single-user debug tool per spec. Multi-user adds auth, CRDT, presence — all orthogonal to debugging value. | Single-user. Share via JSON export (trace or screenshot). |
| **A/B test simulation** | This is a campaign feature, not a debugging feature. Braze/Customer.io handle A/B at campaign level. | Debug the split logic; A/B testing lives in campaign builder. |
| **Email content preview/rendering** | This is what `nitro_send_test_message` + `nitro_review_delivery` already do. Simulator verifies *path*, not *content*. | Partner with existing content preview tools. Simulator shows which email *would* send, not how it looks. |
| **Analytics / metrics dashboard** | Post-send analytics exist. Simulator is pre-send debugger. | Analytics live in campaign/flow dashboards. |
| **Historical trace replay** | V2+ feature. MVP is single-shot trace. | Export trace JSON for manual comparison. |
| **Full Liquid path-walking** | Complex to build, low immediate value. V1 shows resolved values; full drill-down deferred. | Show resolved value + source key. Full path-walking in V2. |
| **Cross-flow emit_event tracing** | Multi-flow architecture is complex. MVP is draft-only, one flow at a time. | Show downstream fan-out as collapsed tree (V3). |
| **Drag-and-drop flow editing** | This is the flow *builder*, not the flow *debugger*. Simulator is read-only overlay. | Simulator lives as bottom dock on existing flow builder. |

## Feature Dependencies

```
Flow canvas rendering → Path highlight overlay (overlay depends on canvas)
JSON editor → Sample payload templates (templates populate editor)
Contact selection → Contact.* field population (selection feeds evaluation)
Step-by-step log → Split evaluation popover (popover is detail view of split step)
Step-by-step log → Liquid variable resolution (resolution is detail view of email/render step)
Run Trace → All trace features (everything depends on trace execution)
Recent webhook auto-fill → JSON editor (auto-fill populates editor)
Wait step timeline → Trace result (timeline reads from trace evaluation)
```

## MVP Recommendation

**V1 (MVP — 1-2 weeks):** Ship the debugging loop:
1. Flow canvas rendering (React Flow)
2. JSON event payload editor with sample templates
3. Contact selector
4. "Run Trace" button → step-by-step evaluation log
5. Path highlight overlay on canvas
6. Per-step PASS/FAIL status pills

**V2 (+1 week):** Depth features:
7. Split evaluation popover (per-condition drill-down)
8. Liquid variable resolution with source path
9. Branch override / sandbox mode
10. Wait step timeline visualization

**V3 (+1 week):** Extensibility:
11. Event chain tracing (downstream fan-out tree)
12. Trace diff between runs
13. Export trace as JSON
14. Recent webhook auto-fill from `nitro_query` events

**Defer indefinitely:**
- Monaco editor
- Real-time collaboration
- A/B test simulation
- Email content preview
- Analytics dashboard
- Full Liquid path-walking

## Sources

- Klaviyo flow preview docs (help.klaviyo.com) — profile preview, trigger preview, suggested profiles
- Braze Canvas test paths (braze.com/docs) — Test Canvas, preview user paths, experiment paths
- Customer.io journey builder (docs.customer.io) — branches, queue drafts, export workflow
- Courier automation debugger (courier.com/changelog) — breakpoints, diff panel, node validation
- Yellow.ai flow debugger (docs.yellow.ai) — breakpoints, step-over, variable inspection
- FlowingMail visual workflow editor (flowingmail.com) — dry-run mode, node inspection
- Nitrosend event-stream-flow-simulator.md — project spec and design principles
