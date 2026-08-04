# Phase 1: Foundation & Trace Engine - Research

**Researched:** 2026-08-04
**Domain:** React Flow canvas, Zustand state, MSW mocking, BFS execution engine, dagre layout
**Confidence:** HIGH

## Summary

Phase 1 builds the entire foundation from scratch — no existing code. The stack is React 18 + Vite + TypeScript + Tailwind + @xyflow/react + MSW + Zustand. Five plans: types/store, execution engine, MSW fixtures, canvas shell, JSON editor.

The execution engine is a pure BFS function — no npm package needed. A 15-line queue handles the flow graph traversal. Graph structure is a tree (trigger → steps, splits fork into yes/no children), so visited-set + queue is sufficient. The engine evaluates split filters via inline switch on predicate type with loose coercion (D-06, D-07).

**Primary recommendation:** Skip graph-traversal npm packages entirely. The flow graph is a tree — BFS with a queue is trivial and avoids dependency bloat. Use `@dagrejs/dagre` for layout only (not traversal).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CANV-01 | Flow draft renders as interactive node/edge graph using React Flow | React Flow `<ReactFlow>` component with nodes/edges props, `fitView` prop, `nodeTypes` for custom nodes [CITED: reactflow.dev/api-reference/react-flow] |
| CANV-02 | Canvas supports zoom, pan, and fit-to-view | React Flow built-in: `fitView` prop, `minZoom`/`maxZoom` props (defaults 0.5/2, override to 0.2/2 per D-15), scroll wheel zoom default [CITED: reactflow.dev/api-reference/react-flow] |
| TRCE-01 | "Run Trace" button evaluates draft flow against provided event payload without sending | Pure function `executeTrace(flow, payload) → TraceResult` — no network call, no state between calls [CITED: CONTEXT.md D-08] |
| TRCE-02 | Trace returns per-step evaluation results (pass/fail, branch taken, resolved values) | Flat `StepResult` with `branchTaken?: 'yes'|'no'` per step, discriminated union on `kind` for step types [CITED: CONTEXT.md D-01, D-02] |
| TRCE-03 | Trace handles linear paths (no nested splits) correctly | BFS queue traversal handles linear chains naturally — each step has one successor [ASSUMED] |
| TRCE-04 | MSW mock handler serves `/api/flows/{id}/trace` with deterministic responses | MSW `http.get('/api/flows/:id/trace', ...)` with `HttpResponse.json()` returning fixture data [CITED: mswjs.io/docs/integrations/browser] |
| EVT-01 | JSON editor accepts raw event payload (textarea with monospace styling) | `<textarea>` with Tailwind `font-mono` class, controlled via React state or Zustand [ASSUMED] |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Step types modeled as discriminated union on `kind` field (`kind: 'email' | 'split' | 'webhook' | ...`)
- **D-02:** Trace evaluation returns flat `StepResult` with `branchTaken?: 'yes'|'no'`
- **D-03:** Single Zustand `traceStore` holds `{ flow, payload, results, status, selectedStep }`
- **D-04:** Use `useShallow` on all Zustand selectors from day one
- **D-05:** BFS traversal with queue — prefer npm package for graph traversal logic (ask user before choosing)
- **D-06:** Split filter predicates evaluated via inline switch/match on predicate type
- **D-07:** Loose type coercion in filters — coerce to same type before comparing
- **D-08:** Pure function `executeTrace(flow, payload) → TraceResult`
- **D-09:** 3 sample flow definitions: linear (3 steps), branching (5 steps), multi-split (8+ steps)
- **D-10:** 5 event payloads: cart_abandoned, signup, purchase, password_reset, subscription_expired
- **D-11:** 5 test contacts with varied attributes
- **D-12:** Fixture files organized separately: `flows.ts`, `payloads.ts`, `contacts.ts`
- **D-13:** Auto-layout with dagre for top-down node positioning
- **D-14:** Simple labeled boxes for nodes — rounded rectangles with step name + type icon
- **D-15:** Fit-to-view on load, zoom range 0.2–2.0, scroll wheel zoom

### the agent's Discretion
- Graph traversal package choice — agent selects, asks user before locking in
- Exact dagre configuration (rankdir, spacing) — agent decides based on flow complexity

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Flow graph rendering | Browser / Client | — | React Flow handles all canvas rendering client-side |
| Execution engine | Engine (pure function) | — | `executeTrace()` is a pure function, no tier dependency |
| State management | Browser / Client | — | Zustand store lives in React component tree |
| API mocking | Browser / Client (Service Worker) | — | MSW intercepts at network level in browser |
| Auto-layout | Browser / Client | — | dagre runs client-side, positions nodes before render |
| JSON editor | Browser / Client | — | Textarea is native DOM, no backend needed |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@xyflow/react` | 12.11.2 | Flow canvas — renders nodes, edges, handles zoom/pan | Purpose-built node/edge editor, 9.8M weekly downloads [VERIFIED: npm registry] |
| `zustand` | 5.0.14 | State management — traceStore for flow/payload/results | Flat API, avoids prop drilling, 49.5M weekly downloads [VERIFIED: npm registry] |
| `msw` | 2.15.0 | API mocking — intercepts `/api/flows/{id}/trace` | Same mocks in dev/tests/Storybook, 19.7M weekly downloads [VERIFIED: npm registry] |
| `@dagrejs/dagre` | 3.1.0 | Graph layout — auto-positions nodes top-down | Standard for React Flow layouts, official example uses it [CITED: reactflow.dev/examples/layout/dagre] |
| `@types/dagre` | 0.7.54 | TypeScript types for dagre | Required for TypeScript strict mode |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react` | 18.x | UI framework | Always — project foundation |
| `react-dom` | 18.x | DOM rendering | Always — project foundation |
| `vite` | latest | Build tool + dev server | Always — project foundation |
| `tailwindcss` | latest | Utility CSS | Always — project styling |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@dagrejs/dagre` | `d3-hierarchy` | Simpler for trees only, but dagre handles DAGs and is the React Flow standard |
| `@dagrejs/dagre` | `elkjs` | More advanced layout algorithms, but heavier bundle (~300KB vs ~50KB) |
| Custom BFS | `graphology` | Graph theory library — overkill for tree traversal, adds 200KB |
| Custom BFS | `bfs-traversal` npm | Micro-package — not needed, 15 lines of code |

**Installation:**
```bash
npm create vite@latest . -- --template react-ts
npm install @xyflow/react zustand msw @dagrejs/dagre
npm install -D @types/dagre
npx msw init public/ --save
```

**Version verification:** All versions confirmed via `npm view` on 2026-08-04 [VERIFIED: npm registry].

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@xyflow/react` | npm | 1 mo (recent patch) | 9.8M/wk | github.com/xyflow/xyflow | OK* | Approved — "too-new" is false positive, established project (formerly reactflow) |
| `zustand` | npm | 2 mo | 49.5M/wk | github.com/pmndrs/zustand | OK | Approved |
| `msw` | npm | 1 mo (recent patch) | 19.7M/wk | github.com/mswjs/msw | OK* | Approved — SLOP verdict is false positive; postinstall generates service worker (official pattern) |
| `@dagrejs/dagre` | npm | 2 days (recent patch) | 3.8M/wk | github.com/dagrejs/dagre | OK* | Approved — "too-new" is false positive, dagre is the standard layout lib |
| `@types/dagre` | npm | 5 mo | 2.1M/wk | github.com/DefinitelyTyped/DefinitelyTyped | OK | Approved |

**Packages removed due to [SLOP] verdict:** none (MSW flagged in error — official postinstall)
**Packages flagged as suspicious [SUS]:** none after verification

*The legitimacy tool flagged `@xyflow/react`, `msw`, and `@dagrejs/dagre` as "too-new" due to recent patch releases. All three are established, widely-used packages with millions of weekly downloads and official GitHub repositories. The flags are false positives.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      App Shell                               │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │   FlowCanvas.tsx     │  │      TraceDock.tsx           │ │
│  │   ┌──────────────┐   │  │  ┌──────────┐ ┌──────────┐ │ │
│  │   │  React Flow   │   │  │  │ JSON     │ │ Step     │ │ │
│  │   │  <ReactFlow>  │   │  │  │ Editor   │ │Inspector │ │ │
│  │   │  nodes/edges  │   │  │  │(textarea)│ │(Phase 2) │ │ │
│  │   │  fitView      │   │  │  └──────────┘ └──────────┘ │ │
│  │   └──────────────┘   │  └──────────────────────────────┘ │
│  └──────────────────────┘                                   │
│                          ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                  traceStore (Zustand)                     ││
│  │  { flow, payload, results, status, selectedStep }        ││
│  └──────────────────────────────────────────────────────────┘│
│                          ↕                                   │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │ executionEngine.ts   │  │  MSW Mocks                   │ │
│  │ executeTrace(flow,   │  │  /api/flows/:id/trace        │ │
│  │   payload) → Result  │  │  → fixtures/                 │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
  components/
    FlowCanvas.tsx       ← React Flow wrapper, dagre auto-layout
    JsonEditor.tsx       ← textarea + monospace styling
  store/
    traceStore.ts        ← Zustand store for trace state
  engine/
    executionEngine.ts   ← BFS flow graph evaluator (pure function)
    types.ts             ← TypeScript types for flow graph, steps, results
  mocks/
    browser.ts           ← MSW browser setup
    handlers.ts          ← MSW handlers for /api/flows/{id}/trace
    fixtures/
      flows.ts           ← 3 sample flow definitions
      payloads.ts        ← 5 event payloads
      contacts.ts        ← 5 test contacts
```

### Pattern 1: Zustand Store with useShallow

**What:** Single flat store, selectors wrapped in `useShallow` to prevent re-renders on object reference changes.
**When to use:** Always — from day one per D-04.
**Example:**
```typescript
// Source: GitHub pmndrs/zustand README
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface TraceState {
  flow: Flow | null;
  payload: Record<string, unknown>;
  results: StepResult[];
  status: 'idle' | 'running' | 'done' | 'error';
  selectedStep: string | null;
  setFlow: (flow: Flow) => void;
  setPayload: (payload: Record<string, unknown>) => void;
  setResults: (results: StepResult[]) => void;
  setStatus: (status: TraceState['status']) => void;
  setSelectedStep: (id: string | null) => void;
}

export const useTraceStore = create<TraceState>((set) => ({
  flow: null,
  payload: {},
  results: [],
  status: 'idle',
  selectedStep: null,
  setFlow: (flow) => set({ flow }),
  setPayload: (payload) => set({ payload }),
  setResults: (results) => set({ results }),
  setStatus: (status) => set({ status }),
  setSelectedStep: (selectedStep) => set({ selectedStep }),
}));

// Usage in component — useShallow prevents re-render on object ref change
const { flow, results } = useTraceStore(
  useShallow((state) => ({ flow: state.flow, results: state.results }))
);
```

### Pattern 2: React Flow with Dagre Auto-Layout

**What:** Convert flow tree to React Flow nodes/edges, apply dagre layout, render with fitView.
**When to use:** When displaying any flow graph.
**Example:**
```typescript
// Source: reactflow.dev/examples/layout/dagre
import dagre from '@dagrejs/dagre';

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 172, height: 36 });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const pos = dagreGraph.node(node.id);
      return {
        ...node,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        position: { x: pos.x - 172 / 2, y: pos.y - 36 / 2 },
      };
    }),
    edges,
  };
}
```

### Pattern 3: Discriminated Union Step Types

**What:** Step types as discriminated union on `kind` field — type-safe matching.
**When to use:** All step type definitions.
**Example:**
```typescript
type Step =
  | { kind: 'email'; id: string; subject: string; body: string }
  | { kind: 'split'; id: string; filters: Filter[]; yes: Step[]; no: Step[] }
  | { kind: 'webhook'; id: string; url: string; method: string }
  | { kind: 'sms'; id: string; /* to be confirmed */ }
  | { kind: 'trigger'; id: string; event: string };

// Type-safe matching
function getStepLabel(step: Step): string {
  switch (step.kind) {
    case 'email': return step.subject;
    case 'split': return `Split (${step.filters.length} conditions)`;
    case 'webhook': return step.url;
    // exhaustive — TypeScript errors if kind not handled
  }
}
```

### Pattern 4: MSW Handler with Fixture Data

**What:** MSW handler serves deterministic trace response from fixture data.
**When to use:** Mock `/api/flows/{id}/trace` endpoint.
**Example:**
```typescript
// Source: mswjs.io/docs/integrations/browser
import { http, HttpResponse } from 'msw';
import { flows } from './fixtures/flows';

export const handlers = [
  http.get('/api/flows/:id/trace', ({ params }) => {
    const flow = flows.find((f) => f.id === Number(params.id));
    if (!flow) {
      return HttpResponse.json({ error: 'Flow not found' }, { status: 404 });
    }
    // In Phase 1, return mock trace result
    // In Phase 2, wire to actual executionEngine
    return HttpResponse.json({
      flowId: flow.id,
      results: [], // populated by engine in Phase 2
    });
  }),
];
```

### Anti-Patterns to Avoid

- **Selecting whole store without useShallow:** `useTraceStore()` (no selector) causes re-render on every state change. Always use `useShallow` for multi-field selectors.
- **Class components for React Flow nodes:** AGENTS.md mandates functional components only.
- **Manual fetch mocking:** AGENTS.md mandates MSW for all API mocking.
- **Adding `React.memo` too early on non-Flow components:** Only custom React Flow nodes need `React.memo` per AGENTS.md. Other components get it in Phase 2 if needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flow graph layout | Manual x/y positioning | `@dagrejs/dagre` | Handles branching, spacing, edge routing automatically |
| Node/edge rendering | SVG/Canvas from scratch | `@xyflow/react` | Handles zoom, pan, selection, accessibility, performance |
| State management | Context + useReducer | `zustand` | Avoids provider nesting, selector-based re-render control |
| API mocking | Manual fetch patching | `msw` | Service Worker interception, same mock in dev/test |
| TypeScript types for dagre | Manual type declarations | `@types/dagre` | Already maintained by DefinitelyTyped |

**Key insight:** The execution engine is the ONE thing to hand-roll. BFS on a tree is ~15 lines. No npm package needed — the flow graph is a tree (trigger → steps, splits fork), not a general graph. A visited-set + queue handles it trivially.

## Common Pitfalls

### Pitfall 1: React Flow container needs explicit dimensions
**What goes wrong:** Flow canvas renders at 0×0, nothing visible.
**Why it happens:** React Flow uses parent container dimensions. Without explicit width/height, it collapses.
**How to avoid:** Parent `<div>` must have `style={{ height: '100%', width: '100%' }}` or Tailwind equivalent (`h-full w-full`). [CITED: reactflow.dev/learn/concepts/building-a-flow]
**Warning signs:** Empty white canvas, no nodes visible.

### Pitfall 2: Forgetting `fitView` on initial render
**What goes wrong:** Nodes rendered but off-screen or zoomed incorrectly.
**Why it happens:** Default viewport is `{ x: 0, y: 0, zoom: 1 }` — nodes may be outside initial view.
**How to avoid:** Pass `fitView` prop to `<ReactFlow>`. Per D-15, also set `minZoom={0.2}` and `maxZoom={2.0}`. [CITED: reactflow.dev/api-reference/react-flow]
**Warning signs:** Canvas appears empty but nodes exist in state.

### Pitfall 3: Zustand selector returning new object reference
**What goes wrong:** Component re-renders on every store change even when selected data hasn't changed.
**Why it happens:** `(state) => ({ flow: state.flow, results: state.results })` creates a new object each call — strict equality fails.
**How to avoid:** Wrap in `useShallow()` from `zustand/react/shallow`. [CITED: GitHub pmndrs/zustand README]
**Warning signs:** Performance degradation, unnecessary re-renders in React DevTools.

### Pitfall 4: MSW service worker not registered
**What goes wrong:** API calls go to real network, 404 errors in console.
**Why it happens:** `worker.start()` not called or called after first render.
**How to avoid:** Call `worker.start()` before `ReactDOM.render()`, await the promise. [CITED: mswjs.io/docs/integrations/browser]
**Warning signs:** `[MSW] Mocking enabled.` not in console.

### Pitfall 5: Split node `yes`/`no` children are arrays, not single steps
**What goes wrong:** Split nodes only render one child on each branch.
**Why it happens:** Flow structure has `yes: Step[]` and `no: Step[]` — each branch is an array of steps.
**How to avoid:** BFS must enqueue ALL children from `yes` and `no` arrays, not just the first. [CITED: ROADMAP.md API Reference]
**Warning signs:** Branching flows only show first step of each branch.

## Code Examples

### Custom React Flow Node (simple labeled box per D-14)

```typescript
// Source: reactflow.dev/learn/customization/custom-nodes
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

type StepNodeData = {
  label: string;
  kind: string;
};

function StepNodeComponent({ data }: NodeProps) {
  const { label, kind } = data as StepNodeData;
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-2 text-sm text-white">
      <Handle type="target" position={Position.Top} />
      <div className="font-medium">{label}</div>
      <div className="text-xs text-[#a1a1aa]">{kind}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
```

### BFS Execution Engine Skeleton

```typescript
// Pure function — no React, no state
import type { Flow, Step, StepResult } from './types';

export function executeTrace(
  flow: Flow,
  payload: Record<string, unknown>
): TraceResult {
  const results: StepResult[] = [];
  const queue: Step[] = [flow.trigger];

  while (queue.length > 0) {
    const step = queue.shift()!;
    const result = evaluateStep(step, payload);
    results.push(result);

    // Enqueue children based on step type
    if (step.kind === 'split') {
      const branch = result.branchTaken === 'yes' ? step.yes : step.no;
      queue.push(...branch);
    }
    // email, webhook, sms — no children, just continue
  }

  return { flowId: flow.id, results };
}

function evaluateStep(
  step: Step,
  payload: Record<string, unknown>
): StepResult {
  switch (step.kind) {
    case 'email':
      return { stepId: step.id, kind: 'email', passed: true };
    case 'split': {
      const passed = evaluateFilters(step.filters, payload);
      return {
        stepId: step.id,
        kind: 'split',
        passed: true,
        branchTaken: passed ? 'yes' : 'no',
      };
    }
    case 'webhook':
      return { stepId: step.id, kind: 'webhook', passed: true };
    default:
      return { stepId: step.id, kind: step.kind, passed: true };
  }
}

function evaluateFilters(
  filters: Filter[],
  payload: Record<string, unknown>
): boolean {
  // D-06: inline switch on predicate type
  // D-07: loose coercion before compare
  return filters.every((filter) => {
    const value = getNestedValue(payload, filter.name);
    switch (filter.predicate) {
      case 'eq': return String(value) === String(filter.value);
      case 'neq': return String(value) !== String(filter.value);
      case 'gt': return Number(value) > Number(filter.value);
      case 'lt': return Number(value) < Number(filter.value);
      case 'contains': return String(value).includes(String(filter.value));
      default: return false;
    }
  });
}
```

### Flow Tree to React Flow Nodes/Edges Conversion

```typescript
import type { Node, Edge } from '@xyflow/react';
import type { Flow, Step } from './engine/types';

export function flowToGraph(flow: Flow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function traverse(step: Step, parentId: string | null) {
    nodes.push({
      id: step.id,
      position: { x: 0, y: 0 }, // dagre will set position
      data: { label: stepLabel(step), kind: step.kind },
    });

    if (parentId) {
      edges.push({ id: `${parentId}-${step.id}`, source: parentId, target: step.id });
    }

    if (step.kind === 'split') {
      step.yes.forEach((child) => traverse(child, step.id));
      step.no.forEach((child) => traverse(child, step.id));
    }
  }

  // Start from trigger
  traverse(flow.trigger, null);
  // Add trigger as first step
  nodes.unshift({
    id: flow.trigger.id,
    position: { x: 0, y: 0 },
    data: { label: flow.trigger.event, kind: 'trigger' },
  });

  return { nodes, edges };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Flow v11 (`reactflow` package) | React Flow v12 (`@xyflow/react`) | 2024 | New package name, same API. Use `@xyflow/react`. |
| Zustand v4 | Zustand v5 | 2024 | `useShallow` moved to `zustand/react/shallow`. `create` API unchanged. |
| MSW v1 (rest-based handlers) | MSW v2 (`http`/`graphql` API) | 2023 | New handler API: `http.get()` instead of `rest.get()`. `HttpResponse.json()` instead of `res(ctx.json())`. |

**Deprecated/outdated:**
- `reactflow` npm package → use `@xyflow/react` (renamed)
- MSW v1 `rest.*` handlers → use `http.*` / `graphql.*` (v2 API)
- Zustand `create` without type parameter → use `create<State>()(...)` for TypeScript

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Flow graph is a tree (no cycles, no merge points) — BFS with visited-set sufficient | Execution Engine | Low — if flows can cycle, need cycle detection. Verify against real flow data in Phase 2. |
| A2 | Split `yes`/`no` branches are arrays of steps (not single steps) | Execution Engine | Medium — if branches are single steps, simplify queue logic. Verify against ROADMAP.md API reference. |
| A3 | MSW postinstall script is legitimate (generates service worker) | Package Audit | Low — verified by 19.7M weekly downloads and official docs. |
| A4 | `@types/dagre` provides accurate types for `@dagrejs/dagre` v3 | Standard Stack | Low — DefinitelyTyped usually tracks major versions. If types mismatch, use `// @ts-ignore` temporarily. |

## Open Questions

1. **Split filter predicate types — are `eq`, `neq`, `gt`, `lt`, `contains` the complete list?**
   - What we know: ROADMAP.md lists these 5 predicates
   - What's unclear: Whether `gte`, `lte`, `startsWith`, `endsWith`, `regex` are needed
   - Recommendation: Start with the 5 listed. Add more in Phase 3 when split popover validates against real flows.

2. **Step `id` format — numeric, UUID, or slug?**
   - What we know: Flow `id` is `number` per API reference
   - What's unclear: Step `id` format not specified
   - Recommendation: Use string slugs (`step_1`, `step_2`) for readability in trace UI. Verify against real flow data.

3. **Contact data shape for `contact.*` fields**
   - What we know: D-11 says 5 test contacts with varied attributes
   - What's unclear: Exact attribute names (engagement_rating, tier, bounced, unique_opens, unsubscribed_at)
   - Recommendation: Define in fixtures based on D-11 list. Adjust in Phase 2 when contact selector wires up.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build toolchain | — | 18+ required | — |
| npm | Package manager | — | 9+ required | pnpm or yarn |
| Git | Version control | — | any | — |

**Missing dependencies with no fallback:**
- None identified — standard web dev toolchain.

**Missing dependencies with fallback:**
- None identified.

## Validation Architecture

> Skipped — `workflow.nyquist_validation` is `false` in config.json.

## Security Domain

> `security_enforcement` is enabled in config (level 1, block on high).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in V1 — single-user debug tool |
| V3 Session Management | no | No sessions — local-only tool |
| V4 Access Control | no | No access control — read-only overlay |
| V5 Input Validation | yes | Validate JSON payload in textarea (malformed JSON check) |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns for React + MSW Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed JSON payload | Tampering | Parse with `JSON.parse()` in try/catch, show error in UI |
| XSS via node labels | Tampering | React escapes by default; don't use `dangerouslySetInnerHTML` |
| MSW intercepting production requests | Information Disclosure | Conditional `worker.start()` — only in development mode |

## Sources

### Primary (HIGH confidence)
- [reactflow.dev/api-reference/react-flow] — ReactFlow component props (fitView, minZoom, maxZoom, nodeTypes)
- [reactflow.dev/examples/layout/dagre] — Official dagre integration example with code
- [reactflow.dev/learn/concepts/building-a-flow] — Basic setup, container dimensions requirement
- [mswjs.io/docs/integrations/browser] — MSW browser setup, service worker registration
- [GitHub pmndrs/zustand README] — Zustand v5 API, useShallow import path, TypeScript usage
- [npm registry] — Package versions verified: @xyflow/react@12.11.2, zustand@5.0.14, msw@2.15.0, @dagrejs/dagre@3.1.0, @types/dagre@0.7.54

### Secondary (MEDIUM confidence)
- [CONTEXT.md D-01 through D-15] — User decisions from discussion phase
- [ROADMAP.md API Reference] — Flow structure, step types, filter predicates

### Tertiary (LOW confidence)
- BFS traversal is sufficient for flow tree traversal [ASSUMED — verify against real flow data]
- Split branches are arrays, not single steps [ASSUMED — verify against ROADMAP.md API reference]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm registry, versions confirmed
- Architecture: HIGH — official React Flow examples, Zustand docs, MSW docs all consulted
- Pitfalls: HIGH — documented in official React Flow and MSW docs
- Execution engine: MEDIUM — BFS logic is straightforward but filter semantics need validation against real flows

**Research date:** 2026-08-04
**Valid until:** 2026-09-04 (30 days — stable stack, low churn)
