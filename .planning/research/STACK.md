# Technology Stack

**Project:** Event Stream & Flow Execution Simulator
**Researched:** 2026-08-03

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.x | UI framework | Company standard, specified in PROJECT.md |
| TypeScript | 5.x | Type safety | Required for React 18 best practices |
| Vite | 6.x | Build tool | Company standard, fast HMR |
| Tailwind CSS | 3.x | Styling | Company standard |

### Flow Canvas

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @xyflow/react | ^12.11.2 | Node/edge flow canvas | Purpose-built for flow editors. Supports animated trace paths via custom edges with SVG `<animateMotion>`. Handles zoom, pan, node selection out of the box. |

**Animated trace paths implementation:**
```tsx
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

function AnimatedTraceEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: '#1163D0', strokeWidth: 2 }} />
      {/* Animated dot tracing the path */}
      <circle r="4" fill="#1163D0">
        <animateMotion dur="800ms" fill="freeze" path={edgePath} />
      </circle>
    </>
  );
}
```

### Template Resolution

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| liquidjs | ^10.x | Liquid template parsing/resolution | Shopify-compatible, works in browser + Node, TypeScript support, pure JS (no native bindings). Handles nested tags like `{{ data.order.items[0].name }}`. |

**Why liquidjs over alternatives:**
- `shopify/liquid` (Ruby) — not usable in browser
- `nicolo-ribaudo/liquidjs` fork — unnecessary, main package is active
- Custom parser — massive effort, error-prone for edge cases

**Usage pattern:**
```ts
import { Liquid } from 'liquidjs';

const engine = new Liquid();
const resolved = await engine.parseAndRender(
  'Hello, {{ contact.first_name }}!',
  { contact: { first_name: 'Sam' } }
);
```

### API Mocking

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| msw | ^2.15.0 | Mock API handlers | Intercepts at network layer. Same mocks work in dev, Storybook, and tests. Express-like routing syntax. |

**Key v2 changes:**
- `rest` namespace → `http` namespace
- `res(ctx.json(...))` → `HttpResponse.json(...)`
- Uses standard Fetch API `Request`/`Response` objects

**Handler pattern:**
```ts
import { http, HttpResponse } from 'msw';

const handlers = [
  http.post('/api/flows/:flowId/trace', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      trace_id: 'trace_mock',
      steps: [/* mock trace response */],
    });
  }),
];
```

### JSON Editor

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| textarea + monospace CSS | — | V1 JSON editor | Monaco is 30MB+. Autocomplete deferred to V2. |
| json-edit-react | ^1.x | V2 upgrade path | Zero runtime dependencies, inline editing, search/filter, customizable UI. |

**Why textarea for V1:**
- PROJECT.md explicitly states: "textarea over Monaco — Monaco is 30MB+"
- JSON payloads in this use case are small (< 1KB typical)
- Autocomplete deferred to V2

**Why json-edit-react for V2:**
- Zero dependencies (self-contained)
- Inline editing with validation
- Search/filter capability
- Theme customization (light/dark)
- < 50KB gzipped vs Monaco's 30MB+

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React state + Context | — | V1 state | Data flow is local per component. No Redux/Zustand needed for V1. |
| Zustand | ^5.x | V2 upgrade (if needed) | Lightweight, no boilerplate, works with React 18. Add only when context prop drilling becomes painful. |

**Why not Redux for V1:**
- Flow trace state is local to the simulator dock
- No shared state across distant components
- React state + context covers V1 scope

### Testing & Development

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Storybook | 8.x | Component development | Isolated component development and visual testing |
| Vitest | ^3.x | Unit testing | Fast, Vite-native, TypeScript-first |
| @testing-library/react | ^16.x | Component testing | Standard for React component tests |

### Fonts

| Font | Purpose | Source |
|------|---------|--------|
| JetBrains Mono | JSON payloads, Liquid tags, code | Google Fonts (free) |
| Inter | UI chrome, buttons, labels | Google Fonts (free) |

## Dependencies Summary

### New (add to package.json)

```json
{
  "dependencies": {
    "@xyflow/react": "^12.11.2",
    "liquidjs": "^10.0.0",
    "msw": "^2.15.0"
  },
  "devDependencies": {
    "json-edit-react": "^1.0.0",
    "@types/node": "^22.0.0"
  }
}
```

### Existing (already in project)

- react, react-dom (^18.x)
- typescript (^5.x)
- vite (^6.x)
- tailwindcss (^3.x)

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Flow canvas | @xyflow/react | draw.io, gojs | @xyflow/react is purpose-built for React, MIT license, active maintenance |
| Template engine | liquidjs | liquid (Ruby), nunjucks | liquidjs is only browser-compatible Liquid parser |
| API mocking | msw | json-server, miragejs | msw intercepts at network layer, same mocks work everywhere |
| JSON editor (V1) | textarea | Monaco, CodeMirror | Monaco is 30MB+, CodeMirror is 5MB+. V1 doesn't need syntax highlighting |
| JSON editor (V2) | json-edit-react | react-json-view, react-json-editor | json-edit-react has zero deps, better customization |
| State management | React state | Redux, Zustand | V1 scope is local; add Zustand only when needed |

## Anti-Patterns to Avoid

1. **Don't add Monaco for V1** — 30MB+ for basic JSON editing is overkill. textarea + monospace CSS is sufficient.

2. **Don't use Redux for V1** — Flow trace state is local to the simulator dock. React state + context is enough.

3. **Don't build custom Liquid parser** — liquidjs handles all Shopify-compatible Liquid syntax. Custom parsers miss edge cases.

4. **Don't mock at function level** — Use MSW to intercept at network layer. Same mocks work in dev, tests, and Storybook.

5. **Don't animate with CSS transitions** — React Flow trace paths need SVG `<animateMotion>` for path-following animation. CSS transitions can't follow arbitrary paths.

## Performance Considerations

| Concern | At 100 nodes | At 1K nodes | At 10K nodes |
|---------|--------------|-------------|--------------|
| React Flow rendering | Instant | < 100ms | Consider virtualization |
| Liquid resolution | < 10ms | < 50ms | Batch resolve |
| MSW interception | Negligible | Negligible | Negligible |

## Sources

- @xyflow/react: https://reactflow.dev (official docs)
- liquidjs: https://liquidjs.com (official docs)
- MSW: https://mswjs.io (official docs)
- json-edit-react: https://github.com/CarlosNZ/json-edit-react
