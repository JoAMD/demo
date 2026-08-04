# Concerns & Future Decisions

Open questions, deferred switches, and things to revisit.

---

## Path Animation: Looping → Static

**Decision:** Looping (marching ants) for v1.
**File:** UI-SPEC.md, Animation section
**Date:** 2026-08-04

**Why looping now:** Debug tool — path must stay visually prominent while user inspects steps. CSS `stroke-dashoffset` animation, no JS.

**When to revisit:** If users report distraction or visual clutter during long trace sessions. Static colored line (same orange `#f97316`) is trivial to swap — remove the `@keyframes` rule, keep the stroke color.

**Switch cost:** 1 CSS rule change. No JS, no component refactor.

---
