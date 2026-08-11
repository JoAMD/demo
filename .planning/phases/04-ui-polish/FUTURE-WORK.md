# Phase 4 Future Work

Items deferred from Phase 4 — captured for future review, NOT for v1.

---

## Activity Button (Past Traces)

**Idea:** Add an "Activity" button in the header that opens a panel showing the last 10 traces the user has run in this session (or persisted across sessions via localStorage).

**Why deferred:**
- Not core to the debug value prop (show **why** a flow routed the way it did).
- Adds persistence surface (localStorage shape, dedup by id, max-size eviction).
- Increases UI surface area beyond the debug tool scope.
- Phase 4 goal was visual polish, not feature addition.

**Sketch (when/if re-prioritized):**
- Header button: clock icon + "Activity"
- Click → opens panel (right-side, like inspector) or modal
- Each entry: timestamp, flow name, payload summary, "Rerun" link
- Persist via `localStorage` keyed `nitrosend:traceHistory` — cap at 10 entries, FIFO eviction
- State: extend `traceStore` with `history: TraceResult[]`, `pushToHistory(result)`

**Requirements (would be):**
- ACTV-01: Activity panel shows last 10 traces (most recent first)
- ACTV-02: Each entry shows flow name, timestamp, pass/fail summary
- ACTV-03: Click entry loads its results into the inspector (read-only replay)
- ACTV-04: New traces automatically prepended; oldest evicted at 10

**Out of scope:**
- Cross-session persistence via backend
- Sharing trace history between users
- Detailed result diffs across runs
- Search/filter within activity

---

## Other Phase 4 Decisions Logged for Future

- **Header redesign** (Nitrosend status badge: Draft/Live pill): user explicitly skipped — debug tool, not editor. No v2 commitment.
- **Back arrow / undo / redo**: skipped — debug tool is read-only on a flow, no navigation history needed.
- **"Saved" indicator / "Go Live" button**: skipped — not sending live; simulator runs traces, not deploys.
- **Sidebar (left rail)**: skipped — debug tool uses dock layout (canvas/inspector/editor). Sidebar would compete for space.
- **Monaco editor for JSON** (already in PROJECT.md Out of Scope): textarea sufficient for v1.
- **Sandbox branch override** (SBOX-01/02): already deferred to v2 in REQUIREMENTS.md.
- **Wait timeline visualization** (WAIT-01/02): deferred to v2.
- **Cross-flow emit_event tracing**: MVP is draft-only.

---

*Captured 2026-08-11 during Phase 4 planning*
