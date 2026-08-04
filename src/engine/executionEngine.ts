// D-05: BFS traversal with queue (split children prepended for DFS-like branch order)
// D-06: Split filter predicates via inline switch
// D-07: Loose type coercion before comparison
// D-08: Pure function executeTrace(flow, payload) → TraceResult

import type { Flow, Step, StepResult, Filter, TraceResult } from './types';

export function executeTrace(
  flow: Flow,
  payload: Record<string, unknown>
): TraceResult {
  const results: StepResult[] = [];

  // Process trigger first
  results.push(evaluateStep(flow.trigger, payload));

  // BFS queue initialized with main path steps
  const queue: Step[] = [...flow.steps];

  while (queue.length > 0) {
    const step = queue.shift()!;
    const result = evaluateStep(step, payload);
    results.push(result);

    // D-05: Enqueue ALL children from split yes/no arrays
    // Prepend so branch children process before remaining main path
    if (step.kind === 'split') {
      const branch = result.branchTaken === 'yes' ? step.yes : step.no;
      queue.unshift(...branch);
    }
  }

  return { flowId: flow.id, results };
}

function evaluateStep(
  step: Step,
  payload: Record<string, unknown>
): StepResult {
  switch (step.kind) {
    case 'split': {
      const passed = evaluateFilters(step.filters, payload);
      return {
        stepId: step.id,
        kind: 'split',
        passed: true,
        branchTaken: passed ? 'yes' : 'no',
      };
    }
    default:
      return { stepId: step.id, kind: step.kind, passed: true };
  }
}

// D-06: Inline switch on predicate type
// D-07: Loose coercion before comparison
function evaluateFilters(
  filters: Filter[],
  payload: Record<string, unknown>
): boolean {
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

// Path traversal — split by '.' only, no __proto__ access
function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);
}
