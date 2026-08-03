# Requirements: Event Stream & Flow Execution Simulator

**Defined:** 2026-08-03
**Core Value:** Show **why** a flow routed the way it did, before it sends.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Canvas

- [ ] **CANV-01**: Flow draft renders as interactive node/edge graph using React Flow
- [ ] **CANV-02**: Canvas supports zoom, pan, and fit-to-view
- [ ] **CANV-03**: Executed path highlights as animated blue line on canvas
- [ ] **CANV-04**: Clicking a node in the path jumps the step inspector to that step

### Trace Engine

- [ ] **TRCE-01**: "Run Trace" button evaluates draft flow against provided event payload without sending
- [ ] **TRCE-02**: Trace returns per-step evaluation results (pass/fail, branch taken, resolved values)
- [ ] **TRCE-03**: Trace handles linear paths (no nested splits) correctly
- [ ] **TRCE-04**: MSW mock handler serves `/api/flows/{id}/trace` with deterministic responses

### Event Payload

- [ ] **EVT-01**: JSON editor accepts raw event payload (textarea with monospace styling)
- [ ] **EVT-02**: Sample payload templates pre-fill editor for common event types (cart_abandoned, etc.)
- [ ] **EVT-03**: Contact selector dropdown populates contact.* fields from test contact data

### Step Inspector

- [ ] **INSP-01**: Step-by-step evaluation log shows each step's result in sequence
- [ ] **INSP-02**: Each step displays PASS/FAIL status pill
- [ ] **INSP-03**: Split steps show which branch was taken (yes/no)
- [ ] **INSP-04**: Email steps show resolved subject line and Liquid variable values

### Split Evaluation

- [ ] **SPLT-01**: Clicking a split node opens per-condition popover
- [ ] **SPLT-02**: Popover shows each condition expression, evaluated values, and PASS/FAIL
- [ ] **SPLT-03**: Popover shows overall result (which branch taken) and condition count

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Liquid Resolution

- **LIQD-01**: Show resolved Liquid variable values with source path
- **LIQD-02**: Show whether fallback was applied
- **LIQD-03**: Show full path walked for nested access (e.g., data.items[0].name)

### Sandbox Mode

- **SBOX-01**: Branch override toggle to force trace down specific branch
- **SBOX-02**: Yellow "SANDBOX" badge when override is active

### Wait Timeline

- **WAIT-01**: Visualize wait step duration as horizontal timeline
- **WAIT-02**: Show entry time, exit time, and local timezone conversion

### Export

- **EXPT-01**: Export trace result as JSON
- **EXPT-02**: JSON schema supports re-import

## Out of Scope

| Feature | Reason |
|---------|--------|
| Monaco editor | 30MB+ bundle; textarea sufficient for V1 |
| Real-time collaboration | Single-user debug tool; multi-user adds auth/CRDT overhead |
| A/B test simulation | Campaign feature, not debugging feature |
| Email content preview | Existing `nitro_send_test_message` handles this |
| Analytics dashboard | Post-send analytics exist; simulator is pre-send |
| Cross-flow emit_event tracing | MVP is draft-only, one flow at a time |
| Drag-and-drop flow editing | Simulator is read-only overlay on existing builder |
| Full Liquid path-walking | Complex; V1 shows resolved values only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CANV-01 | Phase 1 | Pending |
| CANV-02 | Phase 1 | Pending |
| CANV-03 | Phase 2 | Pending |
| CANV-04 | Phase 2 | Pending |
| TRCE-01 | Phase 1 | Pending |
| TRCE-02 | Phase 1 | Pending |
| TRCE-03 | Phase 1 | Pending |
| TRCE-04 | Phase 1 | Pending |
| EVT-01 | Phase 1 | Pending |
| EVT-02 | Phase 1 | Pending |
| EVT-03 | Phase 2 | Pending |
| INSP-01 | Phase 2 | Pending |
| INSP-02 | Phase 2 | Pending |
| INSP-03 | Phase 2 | Pending |
| INSP-04 | Phase 2 | Pending |
| SPLT-01 | Phase 3 | Pending |
| SPLT-02 | Phase 3 | Pending |
| SPLT-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-03*
*Last updated: 2026-08-03 after initial definition*
