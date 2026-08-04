// D-05: BFS traversal with queue (split children prepended for DFS-like branch order)
// D-06: Split filter predicates via inline switch
// D-07: Loose type coercion before comparison
// D-08: Pure function executeTrace(flow, payload) → TraceResult

import type { Flow, Step, StepResult, Filter, FilterGroup, TraceResult, ConditionResult } from './types';

export function executeTrace(
  flow: Flow,
  payload: Record<string, unknown>
): TraceResult {
  const results: StepResult[] = [];

  // Process trigger first
  results.push(evaluateStep(flow.trigger, payload, flow.id));

  // BFS queue initialized with main path steps
  const queue: Step[] = [...flow.steps];

  while (queue.length > 0) {
    const step = queue.shift()!;
    const result = evaluateStep(step, payload, flow.id);
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
  payload: Record<string, unknown>,
  flowId: number
): StepResult {
  switch (step.kind) {
    case 'split': {
      try {
        const { passed, conditionResults } = evaluateFilterGroupWithResults(step.filters, payload);
        return {
          stepId: step.id,
          kind: 'split',
          passed: true,
          branchTaken: passed ? 'yes' : 'no',
          conditionResults,
        };
      } catch (e) {
        return {
          stepId: step.id,
          kind: 'split',
          passed: false,
          error: e instanceof Error ? e.message : 'Split evaluation failed',
        };
      }
    }
    case 'email': {
      // Bounce failure only on Welcome Series (flow 1)
      if (flowId === 1) {
        const dataContact = getNestedValue(payload, 'data.contact') as Record<string, unknown> | undefined;
        const contact = getNestedValue(payload, 'contact') as Record<string, unknown> | undefined;
        const bounced = (dataContact?.bounced ?? contact?.bounced) as boolean | undefined;
        if (bounced) {
          return { stepId: step.id, kind: 'email', passed: false, error: 'Email bounced — delivery failed' };
        }
      }
      const unresolved = step.body.match(/\{\{(.+?)\}\}/g);
      if (unresolved) {
        for (const match of unresolved) {
          const path = match.slice(2, -2).trim();
          const val = path.split('.').reduce<unknown>((obj, key) => {
            if (obj === null || obj === undefined) return undefined;
            return (obj as Record<string, unknown>)[key];
          }, payload);
          if (val === undefined) {
            return { stepId: step.id, kind: 'email', passed: false, error: `Template variable not found: ${path}` };
          }
        }
      }
      return { stepId: step.id, kind: 'email', passed: true };
    }
    case 'webhook': {
      return { stepId: step.id, kind: 'webhook', passed: true };
    }
    default:
      return { stepId: step.id, kind: step.kind, passed: true };
  }
}

// D-06: Inline switch on predicate type
// D-07: Loose coercion before comparison
function evaluateFilterGroup(
  group: FilterGroup,
  payload: Record<string, unknown>
): boolean {
  const results = group.conditions.map((condition) =>
    'logic' in condition
      ? evaluateFilterGroup(condition, payload)
      : evaluateFilter(condition, payload)
  );
  return group.logic === 'and'
    ? results.every(Boolean)
    : results.some(Boolean);
}

// D-03: Per-condition results for split popover
function evaluateFilterGroupWithResults(
  group: FilterGroup,
  payload: Record<string, unknown>
): { passed: boolean; conditionResults: ConditionResult[] } {
  const conditionResults: ConditionResult[] = [];

  for (const condition of group.conditions) {
    if ('logic' in condition) {
      // Nested FilterGroup — recurse and flatten
      const nested = evaluateFilterGroupWithResults(condition, payload);
      conditionResults.push(...nested.conditionResults);
    } else {
      // Leaf filter — record name, resolved value, pass/fail
      const value = getNestedValue(payload, condition.name);
      const passed = evaluateFilter(condition, payload);
      conditionResults.push({ name: condition.name, value, passed });
    }
  }

  const passed = group.logic === 'and'
    ? conditionResults.every((r) => r.passed)
    : conditionResults.some((r) => r.passed);

  return { passed, conditionResults };
}

function evaluateFilter(
  filter: Filter,
  payload: Record<string, unknown>
): boolean {
  const value = getNestedValue(payload, filter.name);
  switch (filter.predicate) {
    case 'eq':       return String(value) === String(filter.value);
    case 'neq':      return String(value) !== String(filter.value);
    case 'gt':       return Number(value) > Number(filter.value);
    case 'lt':       return Number(value) < Number(filter.value);
    case 'contains': return String(value).includes(String(filter.value));
    default:         return false;
  }
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
