# Domain Pitfalls: Event Stream & Flow Execution Simulator

**Domain:** Step debugger for event-driven automations
**Researched:** 2026-08-03

---

## Critical Pitfalls

### 1. Simulated-Live Execution Divergence (The Credibility Tax)

**What goes wrong:** The simulator shows "Branch A" but the live executor takes "Branch B." Users lose trust immediately and never use the simulator again. PROJECT.md explicitly names this: "Simulated path must match live executor exactly or users won't trust it."

**Why it happens:**
- Simulator re-implements filter evaluation logic instead of reusing the actual executor code
- Liquid resolution in simulator differs from production (different engine version, different context shape)
- Contact attributes fetched from different source/stale cache vs live lookup
- Edge cases: nil handling, type coercion (string "149" vs number 149), nested array access on empty arrays
- Time-dependent logic: `within_days` filters use simulator clock, not the moment the flow would actually execute

**Consequences:** Users compare simulator output to a real test send, see mismatch, file a bug, lose confidence. The tool becomes shelfware.

**Prevention:**
- Share the evaluation engine between simulator and live executor — single source of truth, not a re-implementation
- If sharing is impossible, run the simulator trace against the same evaluation endpoint the live system uses (the spec's `/api/flows/{flow_id}/trace` endpoint should call into the real executor, not a parallel implementation)
- Add a "cross-validate" mode: run simulator, then run `nitro_send_test_message`, diff the paths. Surface any divergence as a warning badge
- Pin the simulator's Liquid engine version to the exact production version

**Detection:** Compare simulator output to 5+ real test sends across different contact/segment combinations. Any mismatch = critical bug.

**Phase:** Core evaluation engine (Phase 1). Must be right from day one.

---

### 2. React Flow Re-render Cascade on Trace State Updates

**What goes wrong:** Each trace step update triggers re-renders of every node and edge on the canvas. With 30+ nodes, dragging becomes sluggish; with 80+ nodes, the browser stutters. Animated trace paths (stroke-dasharray) make it worse.

**Why it happens:**
- Custom node components not wrapped in `React.memo` — every parent render re-renders all nodes
- State updates for trace highlighting mutate the entire `nodes`/`edges` array reference, invalidating all memoized components
- Animated edges using CSS `stroke-dasharray` are CPU-expensive at scale (confirmed by React Flow community benchmarks)
- Trace path animation and node state updates competing for the same render cycle

**Consequences:** Debugger feels sluggish. Users abandon it for manual log inspection.

**Prevention:**
- Wrap every custom node and edge component in `React.memo` from day one — non-negotiable
- Store trace-highlighted node IDs in a separate field, not by mutating the `nodes` array. Use Zustand `useShallow` for selectors
- Disable React Flow's default `animated` prop on edges. Build a custom trace animation using SVG `<animateMotion>` along the edge path (proven to halve frame drops vs stroke-dasharray)
- Memoize all props passed to `<ReactFlow>` with `useCallback`/`useMemo`
- Collapse hidden sub-trees: nodes not in the current trace path get `hidden: true` to skip DOM mounting entirely
- Cap viewport at `maxZoom={1.5}`, disable `zoomOnScroll` (route scroll to pan) — reduces viewport recalculations

**Detection:** Open Chrome DevTools Performance tab, run a trace on a 50-node flow. Frame drops >5 during animation = needs optimization.

**Phase:** Flow canvas rendering (Phase 1). Optimize early; retrofitting is painful.

---

### 3. Liquid Resolution Edge Cases Produce Silent Wrong Answers

**What goes wrong:** `{{ data.order.items[0].name }}` resolves to empty string when `items` is an empty array. The simulator shows "resolved: ''" with no indication anything went wrong. User sees blank email content in production and blames the simulator for not catching it.

**Why it happens:**
- Liquid treats `nil` and empty string as equivalent in many contexts — `nil` renders as nothing, not as an error
- `strict_variables: true` raises on undefined variables but NOT on nil-valued defined variables (Liquid issue #749)
- The `default` filter masks problems: `{{ x | default: "fallback" }}` silently succeeds even when `x` is undefined
- Nested property access on nil (`{{ nil.property }}`) returns nil without error — the "path walked" is incomplete
- `allow_false` parameter on `default` filter means `false` is truthy in some contexts but falsy in `if` blocks — inconsistent

**Consequences:** Simulator shows "resolved successfully" for values that would be blank/broken in production. False confidence.

**Prevention:**
- Track resolution metadata per variable: was it nil? was fallback applied? was the path fully walked?
- The spec's `liquid_resolutions` array with `fallback_applied` and `path_walked` is the right shape — implement it fully
- Add a warning badge: "⚠ Variable resolved to nil/empty — check upstream data"
- Render the full resolution chain in the hover card: source path → resolved value → fallback decision
- Test against Liquid's actual edge cases: nil parent, empty array index, undefined nested key, `default` filter masking

**Detection:** Create test fixtures with: empty arrays, nil values, missing nested keys, `default` filter chains. Verify simulator flags each correctly.

**Phase:** Liquid resolution display (Phase 2). Core correctness, not polish.

---

### 4. Mock Fixture Drift from Production API Shape

**What goes wrong:** MSW handlers return a mock trace response that doesn't match what the real `/trace` endpoint would return. Fields are missing, types are wrong, error shapes differ. The simulator works perfectly against mocks but breaks against the real API.

**Why it happens:**
- Mock fixtures hand-authored from spec examples, not recorded from real API responses
- No versioning: when the real API adds a field or changes a type, mocks aren't updated
- Error paths (429, 500, malformed payload) never mocked — only happy path covered
- MSW intercepts at network layer (good), but the response shape can still drift from production

**Consequences:** Demo works in dev, breaks in integration. "Works on my machine" syndrome.

**Prevention:**
- Pin every mock fixture to a specific API version. Tag fixtures with `api_version` field
- Record initial fixtures from actual `nitro_compose_flow` and `nitro_send_test_message` responses, not from spec examples
- Mock error responses: rate limit (429), auth failure (401), server error (500), malformed payload (400)
- Add one nightly contract check: hit the real API sandbox, diff response schema against mock fixtures, alert on drift
- Never update a mock to match buggy test behavior — if the mock is wrong, fix the mock, don't suppress the test

**Detection:** Remove all MSW handlers, point at real API sandbox, run the trace flow. Any failure = mock drift.

**Phase:** Mock setup (Phase 1). Fixtures must be grounded in reality from the start.

---

### 5. Split Condition Evaluation Re-implementation Drift

**What goes wrong:** The simulator re-implements the split filter evaluation logic (predicate matching, type coercion, AND/OR grouping) instead of using the actual executor. Subtle differences: the live system treats `"100"` (string) as `100` (number) for `gteq`, but the simulator doesn't. Or the live system evaluates conditions left-to-right with short-circuit, but the simulator evaluates all conditions.

**Why it happens:**
- Split evaluation is complex: predicates (`eq`, `gteq`, `cont`, `within_days`, etc.), type coercion, AND/OR/NOT grouping, nested splits
- Tempting to "just implement it in JS" for the frontend rather than calling the real endpoint
- The spec shows the trace endpoint returns per-condition results — but the simulator might compute them independently

**Consequences:** Condition 1 passes in simulator but fails in production. User sees wrong branch taken.

**Prevention:**
- The trace endpoint MUST be the single evaluation engine. Simulator calls it, displays results. Never evaluate locally
- If a frontend-only mode is needed (no backend), explicitly label it "preview — may diverge from live execution"
- Test with edge cases: string vs number comparison, nil in filter, empty array containment, timezone-sensitive `within_days`

**Detection:** Create a split with 10 different predicate types, run through both simulator and live executor, diff every result.

**Phase:** Core trace endpoint (Phase 1). This IS the correctness foundation.

---

## Moderate Pitfalls

### 6. Trace Animation Confuses Rather Than Clarifies

**What goes wrong:** The animated blue trace line covers edges, obscures labels, and makes it harder to see which branch was actually taken. Users turn it off immediately.

**Prevention:**
- Trace animation ≤ 800ms total (spec already mandates this)
- Use thin line segments (2-3px), not thick overlays
- Highlight the taken path with opacity: taken path = 100% opacity, untaken paths = 30% opacity
- Don't animate all edges simultaneously — animate step-by-step, one edge at a time, synced with the inspector

### 7. Bottom Dock Layout Fights Canvas for Vertical Space

**What goes wrong:** The 3-pane dock takes 40% of viewport height. On a 1080p screen, the flow canvas becomes too cramped to read. Users collapse the dock and lose the inspector.

**Prevention:**
- Default dock height: 30% of viewport, resizable with drag handle
- Minimum canvas height: 40% of viewport — enforce it
- On small screens (< 768px), stack panes vertically instead of side-by-side
- Remember dock height preference in localStorage

### 8. Contact Selector Shows Stale or Incomplete Data

**What goes wrong:** User selects "Sam Chen" from the contact dropdown, but the contact's `attributes.tier` was updated 5 minutes ago in production. Simulator shows stale "standard" instead of current "vip." Split evaluation differs.

**Prevention:**
- Fetch contact data fresh on every trace run, not on dropdown open
- Show a "last synced" timestamp next to the contact name
- If contact fetch fails, show error — don't use stale cache silently

### 9. JSON Editor Accepts Invalid Payloads Silently

**What goes wrong:** User pastes malformed JSON (trailing comma, missing quote). The textarea shows it, "Run Trace" sends it, the trace endpoint rejects it with a cryptic error. No inline validation.

**Prevention:**
- Parse JSON on every change (debounced 300ms). Show red border + error message on parse failure
- Disable "Run Trace" button when JSON is invalid
- Provide 2-3 sample templates (cart_abandoned, order_confirmed, contact_add) as starting points

### 10. Emit Event Chain Tracing Creates False Completeness

**What goes wrong:** The simulator shows downstream flow fan-out for `emit_event` steps, but the downstream flows may be live, modified since the original trigger, or in a different draft revision. The trace is stale but looks authoritative.

**Prevention:**
- MVP: explicitly scope to draft-only, one flow. No cross-flow tracing. Mark out-of-scope clearly
- When cross-flow tracing is added later: fetch downstream flow draft at trace time, not from cache
- Show a warning: "Downstream flow '{name}' is LIVE — trace uses current draft, not the version that was live at trigger time"

---

## Minor Pitfalls

### 11. Monaco vs Textarea Trade-off Misjudged

**What goes wrong:** Textarea is fine for small payloads but painful for nested JSON (no syntax highlighting, no folding, no line numbers). Users copy payloads into an external editor to edit, then paste back.

**Prevention:** Textarea for V1 (correct call — Monaco is 30MB+). Add syntax highlighting via a lightweight library (Prism.js, ~30KB) in V2 if needed. Don't add Monaco until V3+.

### 12. Step Inspector Auto-Advance Confuses Users

**What goes wrong:** Trace auto-plays through all steps. User can't keep up, misses the critical split evaluation, has to replay.

**Prevention:** Manual stepping by default (spec already mandates this). "Play" button is opt-in, with adjustable speed.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core trace engine | Re-implementing evaluation logic instead of using real executor | Trace endpoint calls into actual flow executor. Non-negotiable. |
| React Flow canvas | Performance degrades with 50+ nodes | Memo everything, custom animation, collapse hidden nodes from day one |
| Liquid resolution | Silent nil/empty resolution masks broken templates | Track fallback metadata, show warnings, test edge cases |
| MSW mocking | Fixtures drift from production API shape | Record from real responses, version-pin, nightly contract check |
| Split evaluation popover | Condition display doesn't match actual evaluation order | Display conditions in the order they're evaluated, not authoring order |
| Bottom dock | Cramped layout on small viewports | Resizable, minimum canvas height enforced, responsive stacking |
| Contact selector | Stale data causes wrong trace results | Fresh fetch on every run, show sync timestamp |

---

## Sources

- React Flow performance docs: reactflow.dev/learn/advanced-use/performance
- React Flow edge animation optimization: liambx.com/blog/tuning-edge-animations-reactflow-optimal-performance
- ByteChef workflow canvas optimization: blog.bytechef.io/blogs/rendering-the-infinite-workflow-canvas-optimization
- Liquid undefined variable handling: github.com/Shopify/liquid/issues/749
- Liquid default filter and strict_variables: github.com/Shopify/liquid/issues/1404
- Liquid types and nil behavior: shopify.github.io/liquid/basics/types/
- MSW mock fidelity: cadence.withremote.ai/blog/mock-external-apis-tests
- Event-driven testing pitfalls: adhdecode.com/message-queues/event-driven-architecture/eda-testing/
- Simulator divergence patterns: adhdecode.com/debugging-distributed/reproducibility-and-debugging-environments/distributed-system-simulators-debugging-testing/
- Divergence-driven debugging research: inria.hal.science/hal-05114444v1/document
