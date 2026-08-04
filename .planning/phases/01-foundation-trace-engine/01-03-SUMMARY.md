---
phase: 01-foundation-trace-engine
plan: 03
subsystem: mocking
tags: [msw, fixtures, api-mocking, browser-worker]

requires:
  - phase: 01-foundation-trace-engine
    provides: "Step, Flow, Filter types from types.ts"
provides:
  - "MSW v2 browser worker setup for dev-mode API interception"
  - "Handler for GET /api/flows/:id/trace returning fixture data or 404"
  - "3 sample flows: linear 3-step, branching 5-step, multi-split 8+ step"
  - "5 event payloads: cart_abandoned, signup, purchase, password_reset, subscription_expired"
  - "5 test contacts with varied engagement, tier, bounced, unsubscribed attributes"
affects: [01-foundation-trace-engine]

tech-stack:
  added: [msw]
  patterns: [msw-v2-http-handler, fixture-data-organization]

key-files:
  created:
    - src/mocks/browser.ts
    - src/mocks/handlers.ts
    - src/mocks/fixtures/flows.ts
    - src/mocks/fixtures/payloads.ts
    - src/mocks/fixtures/contacts.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "MSW v2 API (http, HttpResponse) over v1 rest-based handlers"

patterns-established:
  - "MSW handler pattern: http.get with fixture lookup and 404 fallback"
  - "Fixture organization: separate files per data type (flows, payloads, contacts)"

requirements-completed: [TRCE-04]

coverage:
  - id: D1
    description: "MSW browser worker setup and /api/flows/:id/trace handler"
    requirement: "TRCE-04"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D2
    description: "3 flow fixtures: linear (3-step), branching (5-step), multi-split (8+ step)"
    requirement: "TRCE-04"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D3
    description: "5 event payload fixtures and 5 contact fixtures with varied attributes"
    verification: []
    human_judgment: true
    rationale: "Fixture data correctness requires human review of content variety and attribute coverage"

duration: 1min
completed: 2026-08-04
status: complete
---

# Phase 01 Plan 03: MSW Mock & Fixture Data Summary

**MSW v2 browser worker with /api/flows/:id/trace handler, 3 flow fixtures (linear, branching, multi-split), 5 event payloads, 5 test contacts**

## Performance

- **Duration:** 1 min
- **Started:** 2026-08-04T03:34:12Z
- **Completed:** 2026-08-04T03:36:10Z
- **Tasks:** 2
- **Files modified:** 5 (created), 2 (package.json/lock)

## Accomplishments
- MSW v2 browser setup with `setupWorker` importing handlers
- `http.get('/api/flows/:id/trace')` handler returning fixture data or 404
- 3 flow fixtures matching D-09: linear (3-step), branching (5-step), multi-split (8+ step)
- 5 event payloads matching D-10: cart_abandoned, signup, purchase, password_reset, subscription_expired
- 5 contacts matching D-11: varied engagement, tier, bounced, unsubscribed attributes
- Fixture files organized separately per D-12

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MSW handlers and browser setup** - `27b5bc8` (feat)
2. **Task 2: Create fixture data files** - `161ad51` (feat)

## Files Created/Modified
- `src/mocks/browser.ts` - MSW browser worker setup
- `src/mocks/handlers.ts` - HTTP handler for /api/flows/:id/trace
- `src/mocks/fixtures/flows.ts` - 3 sample flow definitions
- `src/mocks/fixtures/payloads.ts` - 5 event payloads
- `src/mocks/fixtures/contacts.ts` - 5 test contacts with varied attributes
- `package.json` - Added msw dependency
- `package-lock.json` - Lockfile updated

## Decisions Made
- Used MSW v2 API (`http`, `HttpResponse`) instead of deprecated v1 `rest`-based handlers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed msw package**
- **Found during:** Task 1 (MSW handlers)
- **Issue:** msw was not in package.json — required for imports to resolve
- **Fix:** `npm install msw`
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 27b5bc8 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** msw installation was a prerequisite for the plan's deliverables. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MSW mocks ready — "Run Trace" button can return fixture data without backend
- Fixture data provides test scenarios for execution engine validation in Phase 2
- Ready for canvas shell (Plan 1.4) and JSON editor (Plan 1.5)

---
*Phase: 01-foundation-trace-engine*
*Completed: 2026-08-04*
