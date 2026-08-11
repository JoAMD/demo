# Phase 4 Context: UI Polish & Professional Styling

**Date:** 2026-08-11
**Status:** Ready to plan
**Scope split:** 2 plans (header redesign skipped per user)

---

## Decisions from Discussion

### Scope (user-confirmed)

- **4.1 Header Redesign — SKIP.** User said: keep current header, no status badge. Existing App.tsx header (flow name + Export + dark toggle + Run Trace) is sufficient. Skip plan file.
- **4.2 Node Styling — keep.** Type colors, type icons, rounded cards, subtle shadows. Split: purple accent, "yes"=green, "no"=gray. Remove edge arrow labels ("yes"/"no" rendered on edges). **Swap yes/no positions:** "yes" on LEFT, "no" on RIGHT (currently opposite — code iterates `step.yes` first then `step.no`, and dagre `TB` layout stacks right-edges).
- **4.3 Color & Typography Pass — keep.** WCAG AA contrast check on existing tokens, font scale review, spacing consistency.

### Future work (deferred — NOT in v1)

- **Activity panel:** Optional button showing last 10 traces run by user. Logged to FUTURE-WORK.md.
- Back arrow, undo/redo, "Saved" text, "Activity" link, "Go Live" button, sidebar — all skipped (debug tool, not relevant).

### Design Tokens

**Critical user decision (2026-08-11):** node background is **SAME across all step types**. Only the **icon color** differs per type. No per-type tinted bg, no per-type node-* color tokens for bg. Simplifies to: 4 icon color tokens + 1 shared bg (existing `bg-card`).

Target reference (Nitrosend) — icon colors only:
| Type | Icon color | Icon | Hex |
|------|------------|------|-----|
| trigger | orange | calendar | `#f97316` = existing `--color-accent` |
| email | blue | envelope | `#3b82f6` |
| split | purple | branch/diamond (AltRoute style, rotated 90° CW) | `#a855f7` |
| webhook | green | chain link | `#22c55e` = existing `--color-success` |

**No `sms` step in current demo fixtures** — user confirmed no sms in the data. Drop sms kind entirely from icon map and color tokens.

**No new background color tokens** — reuse existing `--bg-card` (works in both light/dark modes via CSS vars). Rounded cards use existing `--radius-card` = 8px. Subtle shadow via Tailwind `shadow-sm`.

### Implementation Constraints (Ponytail)

- **No new deps.** No lucide-react, no heroicons, **NO @mui/icons-material**. User suggested `AltRouteIcon` from MUI — REJECTED. MUI pulls a massive icon library for 4 icons. Inline SVG matches existing pattern in App.tsx (heroicons-style `viewBox="0 0 24 24" strokeWidth={1.5}`).
- **Reuse existing tokens.** Extend Tailwind `@theme` with ONLY icon color tokens (`--color-node-trigger`, etc.). NO bg tokens. NO sms. Background uses existing `--bg-card` (already themed for light/dark).
- **Split icon: branch/diamond glyph.** User referenced MUI's `AltRouteIcon` rotated 90° CW. Inline SVG equivalent: diverging/rotated arrows path. Keep it visually similar (two paths splitting left-right). Heroicons "arrows-pointing-out" or custom diverging arrows path works.
- **Inline icon strategy.** Create `src/components/NodeIcon.tsx` — one function component, dispatch on `kind` → return correct inline SVG. Acceptable colors via `className` prop (Tailwind utility).
- **No "kind" label** in node body. User said: icon + step label is enough. Remove `<div>{kind}</div>` from StepNode body.
- **Existing dagre layout already places split children — swap iteration order.** In `FlowCanvas.tsx` `traverseChildren` (line 73-86), change `step.yes` → emit first so dagre places it left; then `step.no` → right. Dagre TB layout with default settings stacks siblings left-to-right in arrival order. Verify visually after.
- **Edge labels:** Delete `label: 'yes'|'no'` in `addEdge` calls. Keep `addEdge` signature accepting optional label for backward compat (other callers don't use it, so drop entirely).

### "Yes left, no right" — Technical Note

Dagre `rankdir: 'TB'` with default `nodesep` stacks siblings left-to-right in the order they're encountered. `traverseChildren` currently does `step.yes.forEach(...)` then `step.no.forEach(...)` — children arrive in yes-first order, so yes ends up LEFT, no RIGHT. Wait — that's already correct? Need to verify in browser before forcing a code change. If visually wrong, swap to `step.no.forEach(...)` first.

**Hypothesis:** Current order may already produce yes-left if dagre respects arrival order. But user explicitly said "swap" — so something's off. Possible: dagre also considers edge direction/rank and may shuffle. Safest plan: swap iteration order and verify in browser. Document this as a research step in the plan, not a one-line code change.

### Theme Support

Node type colors must work in both light AND dark mode. Two options:
1. Single fixed color per type (e.g. blue envelope bg is blue in both modes) — high contrast, color-coded always visible.
2. Dark mode variants — type colors shift lighter/darker.

Ponytail: pick option 1. Single fixed hex per type color, same in both modes. Use `bg-{color}/10` opacity utility for tinted backgrounds. Text/icons use full hex. Debug tool, not a designer review. Skip dark variant complexity.

### What NOT to Build (YAGNI)

- No node animation on trace run (existing path animation in FlowCanvas is enough).
- No node size variation by type.
- No collapsible nodes.
- No node hover popovers (SplitPopover handles that via existing mechanism).
- No type-specific icons in the inspector — only on canvas nodes.
- No custom SVG sprite system — just inline SVGs (one per kind) in `NodeIcon.tsx`.

---

## Files Touched

| File | Change |
|------|--------|
| `src/index.css` | Extend `@theme` with 4 icon color tokens (no bg, no sms) |
| `src/components/NodeIcon.tsx` | **NEW.** Inline SVG icons for 4 kinds: trigger/email/split/webhook. ~40 lines |
| `src/components/StepNode.tsx` | Add icon (colored) + step label. Remove "kind" sub-label. Shared `bg-card` background. |
| `src/components/FlowCanvas.tsx` | Swap yes/no iteration order, remove edge arrow labels, add sourceHandle for split |
| `src/components/StepInspector.tsx` | (only if needed for typography pass) — defer to plan 2 |
| `src/components/JsonEditor.tsx` | (only if needed for typography pass) — defer to plan 2 |
| `src/components/TraceDock.tsx` | (only if needed for typography pass) — defer to plan 2 |
| `src/App.tsx` | Verify typography consistency — minor tweaks only |

---

## Risks

- **Dagre layout swap might shift node positions unexpectedly.** Mitigation: test in browser before/after. If swap breaks layout, revert and add explicit `sourceHandle`/`targetHandle` per Plan 04-01 fallback.
- **Tailwind v4 color tokens for non-standard names (e.g. `--color-node-trigger`) may need `@theme inline` to be available as `bg-node-trigger` utility.** Verify by checking existing `--color-success` usage; if pattern works for success, it works for new tokens.

---

## Open Questions for User Confirmation

1. Header redesign — confirmed skip, no plan file.
2. sms kind — confirmed drop (no sms in demo fixtures).
3. Background color — confirmed shared `bg-card` across all node types, only icon color differs.
4. Kind sub-label — confirmed drop, icon + step label is enough.
5. MUI icons — rejected, inline SVG matches existing pattern (no new deps).
6. Activity button — confirmed deferred to FUTURE-WORK.md.
7. Yes/no swap — manual visual check included as Task 5 of plan 04-01.

---

*Context captured: 2026-08-11 — Phase 4 planning session*
