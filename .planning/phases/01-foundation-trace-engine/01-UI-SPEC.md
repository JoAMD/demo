---
phase: 1
slug: foundation-trace-engine
status: draft
shadcn_initialized: false
preset: none
created: 2026-08-04
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for the foundation phase. Phase 1 renders the flow graph on a React Flow canvas + a JSON payload editor + a "Run Trace" button. No trace results UI yet (Phase 2). Theme tokens are locked in `ROADMAP.md` and applied verbatim.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — project uses @xyflow/react + Tailwind directly, no shadcn |
| Preset | not applicable |
| Component library | @xyflow/react (canvas), native `<textarea>` (editor) |
| Icon library | inline SVG / Unicode glyphs (per D-14 "step name + type icon") — no icon lib in Phase 1 |
| Font | system-ui default stack (Tailwind `font-sans`); monospace via Tailwind `font-mono` for JSON editor + step labels |

**Rationale for no shadcn:** Stack is locked to `@xyflow/react` + Zustand + MSW + Tailwind. Phase 1 surfaces are canvas + textarea + button — no shadcn components required. Revisit at Phase 2 if popover/dialog/menu needs emerge.

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gap inside node box; handle margin |
| sm | 8px | Node box inner padding (vertical), edge label gap |
| md | 16px | Node box inner padding (horizontal), JSON editor padding, button padding |
| lg | 24px | Canvas-to-dock gutter, section padding |
| xl | 32px | App-level outer padding |
| 2xl | 48px | Major section breaks (not used in Phase 1) |
| 3xl | 64px | Page-level spacing (not used in Phase 1) |

Exceptions: React Flow node default width 172px, height 36px (per RESEARCH.md Pattern 2 — dagre layout assumes these dimensions). Touch target for "Run Trace" button: 40px height (8px grid via `py-2` + text + line-height).

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 12px | 400 | 1.4 |
| Node label (primary) | 14px | 500 | 1.3 |
| Node label (kind tag) | 12px | 400 | 1.3 |
| Button | 14px | 500 | 1.0 |
| JSON editor (mono) | 13px | 400 | 1.5 |

Font families:
- UI: Tailwind default `font-sans` (system-ui stack)
- Code/labels/JSON: Tailwind `font-mono` (ui-monospace stack)

**Locked rationale:** 14px body matches the existing Nitrosend platform chrome (per ROADMAP theme table context). Two weights only (400 + 500) — keeps the contract minimal. JSON editor at 13px gives room for nested payloads without horizontal scroll on 3-pane layout.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0f0f0f` (dark) / `#f5f5f5` (light) | App background, canvas backdrop |
| Secondary (30%) | `#1e1e1e` (dark) / `#ffffff` (light) | Card surfaces, node boxes, JSON editor background |
| Border | `#2a2a2a` (dark) / `#e5e5e5` (light) | Card borders, node box borders, divider lines |
| Text primary | `#ffffff` (dark) / `#18181b` (light) | Node labels, body text, button text |
| Text secondary | `#a1a1aa` (dark) / `#71717a` (light) | Kind tags, metadata, helper text |
| Accent (10%) | `#f97316` | **"Run Trace" button only** (primary CTA in Phase 1) |
| Success | `#22c55e` | Reserved for Phase 2 PASS pills — not rendered in Phase 1 |
| Error | `#ef4444` | Malformed JSON in editor (parse failure indicator on text border) |
| Sidebar | `#1a1a1a` (dark) / `#ffffff` (light) | Reserved for Phase 2 dock wrapper — not used in Phase 1 |

**Accent reserved for:** "Run Trace" button background + label text. Nothing else in Phase 1.

**Light/dark mode:** Tokens are mode-agnostic — switch via CSS class on root (`.dark` / `.light`) or `prefers-color-scheme`. Both palettes defined per ROADMAP.md.

**Node color treatment (Phase 1 only):** all step kinds render in `bg-card` + `border-card` — no per-kind color coding. Phase 2 may add subtle differentiation; Phase 1 keeps it uniform to avoid premature visual commitment.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | "Run Trace" |
| JSON editor placeholder (empty) | "Paste event payload JSON here…" |
| JSON editor helper (below) | "Edit and click Run Trace to evaluate" |
| Run Trace loading state (button) | "Running…" |
| Run Trace success (no UI yet) | — (Phase 2 inspector surfaces results) |
| Empty state (canvas before flow loads) | "No flow loaded" |
| Error state (JSON parse failure) | "Invalid JSON — fix syntax to run trace" (red text under editor) |
| Error state (MSW fetch failure) | "Trace request failed — check console" |
| Node label fallback (unknown step.kind) | "Unnamed step" |
| Button tooltip / aria-label (Run Trace) | "Run trace evaluation" |

**Destructive actions in Phase 1:** none. No delete, no reset, no overwrite. Phase 3 introduces "Export trace" and "Reset sandbox".

**Tone:** terse, debug-tool voice. No marketing language. "Run Trace" not "Execute Simulation Now!". Matches developer audience (lifecycle ops engineers).

---

## UI Considerations

> Phase 1 surfaces are minimal: a canvas, a textarea, one button. UI-state coverage is correspondingly narrow.

Applicable state considerations resolved: 3 covered, 1 backstop, 0 unresolved

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | JSON editor (textarea on first load) | ✅ covered | Renders placeholder text "Paste event payload JSON here…" per Copywriting Contract; helper text "Edit and click Run Trace to evaluate" below |
| empty | Canvas (before flow fetched) | ✅ covered | Renders "No flow loaded" text centered on canvas; React Flow background grid still visible |
| error | JSON editor (malformed JSON on Run Trace click) | ✅ covered | Red border on textarea + error text "Invalid JSON — fix syntax to run trace" below editor; Run Trace button disabled until JSON parses |
| loading | Run Trace button (in-flight request) | 🧪 backstop | Button label swaps to "Running…" and is `disabled`; held-out as visual UI-state test (no trace UI to assert against in Phase 1) |

**Not applicable in Phase 1:** long-text overflow (no prose surfaces), partial state (no trace results to be partial), zero-one-many (single flow loaded, not a list), overflow (no lists in Phase 1).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required — shadcn not initialized |
| third-party | none | not applicable — no `npx shadcn add` calls in Phase 1 |

**Component sourcing for Phase 1:**
- `@xyflow/react` — canvas, handles, controls (npm-verified, see RESEARCH.md Standard Stack)
- `@dagrejs/dagre` — layout only (npm-verified)
- Native HTML `<textarea>` — JSON editor (no dependency)
- Native HTML `<button>` — Run Trace (no dependency)

No shadcn `view` gate triggered — no third-party shadcn blocks added.

---

## Interaction Contracts (Phase 1 specific)

| Interaction | Trigger | Effect |
|-------------|---------|--------|
| Zoom canvas | Scroll wheel / pinch | Zoom range 0.2–2.0 per D-15 |
| Pan canvas | Click + drag empty area | Standard React Flow pan |
| Fit to view | Initial render (once) | `fitView` prop on `<ReactFlow>` — auto-centers all nodes |
| Edit JSON | Type in textarea | Controlled input — value flows to `traceStore.payload` on each keystroke (debounced or not, executor's call — but UI updates immediately) |
| Run Trace | Click "Run Trace" button | (a) Validate JSON parses; (b) Call `executeTrace(flow, payload)` (Phase 1 stub OK); (c) Call MSW mock `/api/flows/{id}/trace`; (d) Phase 1 has no results UI — store `results` in traceStore for Phase 2 inspector to consume |
| JSON parse failure | Run Trace click with invalid JSON | Show error text under editor; button remains enabled but noop (or disabled — pick disabled for clearer affordance) |
| Node hover | Mouse over canvas node | Default React Flow hover (subtle border highlight via `border-card` → `text-primary` border) — no custom tooltip in Phase 1 |
| Node click | Click canvas node | No effect in Phase 1 — Phase 2 wires to step inspector scroll |

**Keyboard:**
- `Tab` through canvas + editor + button (native focus order)
- `Cmd/Ctrl + Enter` while editor focused = click "Run Trace" (power-user shortcut)
- No other shortcuts in Phase 1

**No drag-and-drop, no multi-select, no context menus in Phase 1.** Read-only canvas, single-click node selection, single-button UI.

---

## Layout Skeleton (text wireframe)

```
┌──────────────────────────────────────────────────────────────┐
│ App Header (h-12, bg-sidebar, border-b border-card)         │
│ ┌────────────────────────────────────────────┐ ┌────────────┐ │
│ │                                            │ │            │ │
│ │                                            │ │ JSON       │ │
│ │         FlowCanvas (React Flow)            │ │ Editor     │ │
│ │         bg-primary                         │ │ font-mono  │ │
│ │         fitView on load                    │ │ 13px       │ │
│ │         minZoom 0.2 / maxZoom 2.0          │ │            │ │
│ │                                            │ │ helper     │ │
│ │                                            │ │ text       │ │
│ │                                            │ ├────────────┤ │
│ │                                            │ │ Run Trace  │ │
│ │                                            │ │ (accent)   │ │
│ └────────────────────────────────────────────┘ └────────────┘ │
│  flex-1, h-[calc(100vh-48px)]              w-96, same height │
└──────────────────────────────────────────────────────────────┘
```

**Split:** left = canvas (flex-1), right = 384px (w-96) editor pane. Single row, no bottom dock in Phase 1 — TraceDock is a Phase 2 wrapper that contains the editor + (future) inspector + (future) path overlay.

**Header (h-12 = 48px):** holds app title "Nitrosend Simulator" left, no actions right in Phase 1.

**Responsive:** desktop-first (CANV-02 says zoom/pan/fit — implies wide viewport). Min supported width 1024px. No mobile breakpoints in Phase 1.

---

## Accessibility Notes (Phase 1 floor)

- "Run Trace" button: `<button type="button">` with `aria-label="Run trace evaluation"` (matches Copywriting Contract)
- JSON editor: `<label>` associated via `htmlFor` + `id`, `aria-invalid="true"` when JSON parse fails
- Canvas: React Flow provides ARIA roles for nodes/edges natively — no custom ARIA in Phase 1
- Color contrast: all text-on-bg pairs from ROADMAP theme table meet WCAG AA (verified by token origin — Nitrosend platform tokens)
- Focus ring: Tailwind `focus-visible:ring-2 focus-visible:ring-accent` on button + textarea (accent is `#f97316` — visible on both palettes)
- Keyboard: full tab order header → canvas (via React Flow's keyboard nav) → editor → button

**Not addressed in Phase 1:** screen reader announcements for trace results (no results UI yet), high-contrast mode toggle, reduced-motion preference (no animations in Phase 1 besides React Flow's default edge rendering).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
