# Phase 2: Trace UI & Inspector - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-04
**Phase:** 2-Trace UI & Inspector
**Areas discussed:** Step Inspector Layout, Path Animation, Contact Selector, Run Trace Button

---

## Step Inspector Layout

| Option | Description | Selected |
|--------|-------------|----------|
| A) Bottom dock (3-pane) | JSON editor, step inspector, path info in resizable bottom panel | |
| B) Right sidebar | Fixed right panel, canvas takes full left | |
| C) Collapsible bottom | Toggle open/close with keyboard shortcut | |
| D) 3-column split | Canvas, Step Inspector, JSON Editor side-by-side, all closable/resizable | ✓ |

**User's choice:** 3-column split layout — Canvas | Step Inspector | JSON Editor

**Notes:**
- User asked: "is the demo a variation of flow UI or part of actual flow UI?" — clarified it's a separate testing/debugging UI, not part of flow builder
- User asked: "what is the use of step inspector, why do we need both flow canvas and step inspector?" — clarified canvas = bird's eye overview, inspector = microscope detail view
- User suggested: "step inspector need not be card view, eg: if send email step it can preview the actual email to be sent, so full height, else smaller height but panel still full height"
- Email steps: rendered preview by default, option to switch to raw HTML
- Split steps: show all conditions with unresolved expression AND resolved value
- Navigation: both click canvas nodes AND prev/next buttons
- Empty state before trace: "Run a trace to see results"
- Panels: both button toggle AND drag resize

---

## Path Animation

| Option | Description | Selected |
|--------|-------------|----------|
| A) Animated dashed blue line | Classic trace effect, dashed stroke with dash-offset | |
| B) Color fill nodes + edges | Turn visited nodes/edges blue/green | |
| C) Pulse effect on active step | Highlight current step with pulsing glow | |

**User's choice:** Option A (animated dashed line) with color change

**Notes:**
- User: "not sure of blue though, maybe orange or another colour based on UI theme in main ROADMAP"
- Changed to orange accent color (`#f97316`) to match UI theme
- User added: "steps yet to run could be grayed out" — unexecuted steps use `text-secondary` color

---

## Contact Selector

| Option | Description | Selected |
|--------|-------------|----------|
| A) Auto-merge contact.* fields | Selecting contact inserts `{"contact": {...}}` into JSON editor | ✓ |
| B) Separate contact section | Contact selector above JSON editor, injected at trace time | |
| C) Contact as template variable | Contact sets variable resolved at trace time | |

**User's choice:** A — Auto-merge contact.* fields into JSON editor

**Notes:** No additional clarification needed

---

## Run Trace Button

| Option | Description | Selected |
|--------|-------------|----------|
| A) Header bar | Fixed top-right, always visible | ✓ |
| B) Inside JSON editor | Below textarea, contextual | |
| C) Both | Header + JSON editor locations | |

**User's choice:** A — Header bar, always visible

**Notes:** No additional clarification needed

---

## the agent's Discretion

- Exact panel default widths and resize constraints
- Keyboard shortcuts for prev/next navigation
- Animation timing and easing for path highlight
- Error handling for failed traces (loading state, error messages)

## Deferred Ideas

None — discussion stayed within phase scope
