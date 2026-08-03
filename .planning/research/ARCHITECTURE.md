# Architecture: Event Stream Flow Simulator

**Domain:** React Flow canvas + MSW-mocked trace endpoint
**Researched:** 2026-08-03
**Overall confidence:** HIGH

## Recommended Architecture

Three-layer stack: **Flow Graph** (React Flow canvas) → **Execution Engine** (client-side BFS evaluator) → **Trace Dock** (3-pane inspector). Data flows unidirectional: event payload → engine → step results → canvas overlay + dock.

```
┌─────────────────────────────────────────────────────┐
│  React Flow Canvas                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Trigger  │─▶│ Wait     │─▶│ Split    │──┐       │
│  └──────────┘  └──────────┘  └──────────┘  │       │
│        ▲                                    │       │
│        │ tracePath[] highlights edges       │       │
├────────┼────────────────────────────────────┼───────┤
│  ┌─────┴────────────────────────────────────┴──┐    │
│  │           Zustand Execution Store           │    │
│  │  stepResults[], activeStep, traceStatus     │    │
│  └─────┬────────────────────────────────────┬──┘    │
├────────┼────────────────────────────────────┼───────┤
│  Trace Dock                                  │       │
│  ┌────────────┐ ┌─────────────┐ ┌──────────┐│       │
│  │ JSON Editor│ │Step Inspector│ │Split Pop ││       │
│  │ (textarea) │ │(PASS/FAIL)  │ │(drilldown)││       │
│  └────────────┘ └─────────────┘ └──────────┘│       │
└─────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `FlowCanvas.tsx` | React Flow wrapper, custom node rendering, trace path animation | Zustand store (reads `activeStep`, `tracePath`) |
| `TraceDock.tsx` | Bottom dock layout, 3-pane split | Zustand store (reads/writes `eventPayload`, `stepResults`) |
| `JsonEditor.tsx` | Editable JSON textarea, sample payload templates | TraceDock (controlled via `eventPayload` state) |
| `StepInspector.tsx` | Per-step evaluation log, PASS/FAIL pills, Liquid resolutions | Zustand store (reads `stepResults`, `activeStep`) |
| `SplitPopover.tsx` | Per-condition drill-down for split nodes | Zustand store (reads `splitEvaluation`) |
| `ContactSelector.tsx` | Contact dropdown, auto-populates `contact.*` fields | Nitrosend MCP tools (reads contacts) |
| `mocks/handlers.ts` | MSW handlers for `/api/flows/{id}/trace` | MSW server |
| `executionEngine.ts` | BFS flow graph evaluator, split condition resolution | Pure function, no React dependency |

### Data Flow

1. User edits JSON in `JsonEditor` → updates `eventPayload` in Zustand store
2. User clicks "Run Trace" → calls `executionEngine.evaluate(graph, payload)`
3. Engine performs BFS traversal of flow graph nodes:
   - Trigger: match event name, resolve contact fields
   - Wait: compute exit time (no-op for MVP)
   - Split: evaluate AND conditions against payload + contact attributes
   - Email: resolve Liquid tags, capture subject/body
4. Engine returns `StepResult[]` → written to Zustand store
5. React Flow reads `tracePath` → highlights visited edges with animated blue line
6. StepInspector reads `stepResults` → renders evaluation log with PASS/FAIL per condition
7. SplitPopover reads `splitEvaluation` → shows per-condition breakdown with suggestions

## Patterns to Follow

### Pattern 1: Zustand for Execution State (not Redux)

**What:** Flat, selector-based store for trace state. Each component subscribes only to its slice.

**When:** Always for this project. No Redux/Zustand in project spec, but Zustand is the correct choice here — flat API, avoids prop drilling, prevents unnecessary re-renders.

**Example:**
```typescript
// store/traceStore.ts
import { create } from 'zustand'

interface TraceState {
  eventPayload: Record<string, unknown>
  stepResults: StepResult[]
  activeStep: number | null
  traceStatus: 'idle' | 'running' | 'complete'
  tracePath: string[] // node IDs in execution order

  setPayload: (payload: Record<string, unknown>) => void
  runTrace: (graph: FlowGraph, payload: Record<string, unknown>) => void
  setActiveStep: (index: number) => void
}

export const useTraceStore = create<TraceState>((set) => ({
  eventPayload: {},
  stepResults: [],
  activeStep: null,
  traceStatus: 'idle',
  tracePath: [],

  setPayload: (payload) => set({ eventPayload: payload }),

  runTrace: (graph, payload) => {
    set({ traceStatus: 'running', stepResults: [], tracePath: [] })
    const results = evaluateFlowGraph(graph, payload)
    set({
      stepResults: results,
      tracePath: results.map(r => r.stepKey),
      traceStatus: 'complete',
      activeStep: 0
    })
  },

  setActiveStep: (index) => set({ activeStep: index })
}))
```

### Pattern 2: Client-Side BFS Evaluator (separate from React)

**What:** Pure function that evaluates a flow graph against an event payload. No React dependency. Returns `StepResult[]` with pass/fail per condition.

**When:** Always. The evaluation logic must be testable independently of UI.

**Example:**
```typescript
// lib/executionEngine.ts
interface StepResult {
  stepKey: string
  stepType: string
  status: 'evaluated' | 'scheduled' | 'rendered'
  evaluation: Record<string, unknown> // type varies by stepType
}

function evaluateFlowGraph(
  graph: FlowGraph,
  payload: EventPayload
): StepResult[] {
  const results: StepResult[] = []
  const queue = [graph.trigger] // BFS from trigger node

  while (queue.length > 0) {
    const node = queue.shift()!
    const result = evaluateNode(node, payload)
    results.push(result)

    if (node.type === 'split') {
      const branch = result.evaluation.branch_taken
      const children = node[branch] || []
      queue.push(...children)
    } else if (node.next) {
      queue.push(node.next)
    }
  }

  return results
}
```

### Pattern 3: MSW for Mock Trace Endpoint

**What:** MSW v2.12+ intercepts POST `/api/flows/{id}/trace` and returns a pre-built `TraceResponse` from fixtures. No real backend needed.

**When:** MVP. Real backend added later when Nitrosend implements `/trace` endpoint.

**Example:**
```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { traceFixtures } from './fixtures/traceResponse'

export const handlers = [
  http.post('/api/flows/:flowId/trace', async ({ request }) => {
    const body = await request.json() as { draft_revision_id: number; event_payload: Record<string, unknown> }

    // Return pre-built trace response
    return HttpResponse.json(traceFixtures[body.draft_revision_id] ?? {
      error: 'No fixture for this revision'
    })
  }),

  http.get('/api/flows/:flowId', () => {
    return HttpResponse.json(traceFixtures.flowDraft)
  })
]
```

### Pattern 4: Custom Node Types with State-Driven Styling

**What:** Each React Flow node type reads execution state from Zustand and applies visual classes (running, done, error).

**When:** For all custom nodes (trigger, wait, split, email, etc.)

**Example:**
```typescript
// components/nodes/TriggerNode.tsx
function TriggerNode({ data, id }: NodeProps) {
  const stepResult = useTraceStore(s =>
    s.stepResults.find(r => r.stepKey === id)
  )
  const isActive = useTraceStore(s => s.activeStep ===
    s.stepResults.findIndex(r => r.stepKey === id)
  )

  return (
    <div className={cn(
      'node',
      isActive && 'node--active',
      stepResult?.status === 'evaluated' && 'node--done'
    )}>
      <Handle type="source" position={Position.Bottom} />
      <span>{data.event}</span>
    </div>
  )
}
```

### Pattern 5: Animated Trace Path via Edge Styling

**What:** React Flow edges read `tracePath` from store and apply animated stroke when the edge is part of the execution path.

**When:** For all edges in the flow graph.

**Example:**
```typescript
// components/edges/AnimatedTraceEdge.tsx
function AnimatedTraceEdge(props: EdgeProps) {
  const tracePath = useTraceStore(s => s.tracePath)
  const isInPath = tracePath.includes(props.source) &&
                   tracePath.includes(props.target)

  return (
    <BaseEdge
      {...props}
      style={{
        stroke: isInPath ? '#1163D0' : '#9CA3AF',
        strokeWidth: isInPath ? 3 : 1,
        strokeDasharray: isInPath ? '5 5' : 'none',
        animation: isInPath ? 'dash 0.8s linear' : 'none'
      }}
    />
  )
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: SSE/WebSocket for MVP Trace

**What:** Using EventSource or WebSocket for trace execution.

**Why bad:** MVP trace is synchronous (client evaluates locally). SSE adds complexity without value. The spec says "read-only /trace endpoint (or mock)" — mock means MSW HTTP handler, not live stream.

**Instead:** Simple POST to MSW handler that returns full trace response. Add SSE when real backend streams execution events.

### Anti-Pattern 2: Redux for Trace State

**What:** Using Redux for the execution store.

**Why bad:** Overkill for local component state. Trace state is scoped to the simulator page, not global app state. Redux adds boilerplate without benefit.

**Instead:** Zustand — flat API, selector-based, no providers needed.

### Anti-Pattern 3: Monaco Editor for JSON

**What:** Loading Monaco (30MB+) for the JSON editor.

**Why bad:** Spec explicitly says "textarea over Monaco". 30MB bundle bloat for a debug tool.

**Instead:** `<textarea>` with monospace font, basic JSON validation on blur.

### Anti-Pattern 4: Tight Coupling Between Canvas and Dock

**What:** Passing step results as props from canvas to dock.

**Why bad:** Canvas and dock are siblings, not parent-child. Prop drilling creates fragile coupling.

**Instead:** Both read from Zustand store independently. Canvas reads `tracePath`, dock reads `stepResults` and `activeStep`.

## Build Order (Dependencies)

| Phase | Components | Depends On |
|-------|-----------|------------|
| **1. Foundation** | Types (`FlowGraph`, `StepResult`, `EventPayload`), Zustand store, MSW handlers + fixtures | Nothing |
| **2. Canvas Shell** | `FlowCanvas.tsx`, `ReactFlowProvider` wrapper, custom node types (TriggerNode, WaitNode, SplitNode, EmailNode), basic styling | Phase 1 |
| **3. Trace Dock** | `TraceDock.tsx` (3-pane layout), `JsonEditor.tsx` (textarea + monospace), `StepInspector.tsx` (basic PASS/FAIL pills) | Phase 1 |
| **4. Execution Engine** | `executionEngine.ts` (BFS evaluator), split condition resolution, Liquid tag resolution (stub) | Phase 1 |
| **5. Integration** | "Run Trace" button wiring, `tracePath` → edge animation, `activeStep` → node highlight, `stepResults` → StepInspector | Phases 2-4 |
| **6. Polish** | `SplitPopover.tsx` (condition drill-down), `ContactSelector.tsx` (dropdown + auto-fill), sample payload templates | Phase 5 |

### Phase Implications

- **Phase 1 is pure data/logic** — no UI, easy to test, parallelizable
- **Phase 2+3 are independent** — canvas and dock can be built in parallel
- **Phase 4 is the "brain"** — engine must match live executor exactly or users won't trust it
- **Phase 5 is the critical integration** — this is where the "why did it route here?" value emerges
- **Phase 6 is polish** — split popover and contact selector are differentiators, not blockers

## Scalability Considerations

| Concern | At 1 flow | At 100 flows | At 10K flows |
|---------|-----------|--------------|--------------|
| Trace evaluation | Client-side BFS, instant | Client-side BFS, instant | Client-side BFS, instant (O(n) per flow) |
| MSW fixtures | Hardcoded JSON | Dynamic fixtures from API | Real backend `/trace` endpoint |
| Canvas rendering | React Flow handles | React Flow handles | Add virtualization for large graphs |
| State management | Zustand (in-memory) | Zustand (in-memory) | Zustand + persistence if needed |

## Sources

- flow-engine-hr: React Flow + Zustand + BFS simulation, trace console pattern (GitHub, 2026-04)
- AgentHub: React Flow + Zustand + SSE execution state, animated edges (Hashnode, 2026-05)
- MSW SSE docs: First-class SSE mocking with `sse()` namespace (mswjs.io, 2026-04)
- Spec-kit-goal: XState + React Flow workflow player + canvas editor architecture (GitHub)
- VizLang: React Flow debugger with step-through execution, state inspector (GitHub, 2026)
- DelphiNodeEditor: Debugger architecture with breakpoints, watches, trace entries (DeepWiki, 2026-06)
