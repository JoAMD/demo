import { describe, it, expect } from 'vitest';
import { findStep } from './StepInspector';
import type { Step, Flow } from '../engine/types';

const trigger: Step = { kind: 'trigger', id: 'trigger_1', event: 'cart_abandoned', action_name: 'on_abandon' };
const email1: Step = { kind: 'email', id: 'email_1', subject: 'Subject', body: 'Body' };

function makeFlow(steps: Step[] = []): Flow {
  return { id: 1, name: 'Test', status: 'draft', trigger, steps };
}

describe('findStep — call site behavior (D-16 bug)', () => {
  it('BUG: findStep(flow.steps, trigger_id) returns null (old call site)', () => {
    const flow = makeFlow([email1]);
    // OLD call site: findStep(flow.steps, selectedStep)
    const result = findStep(flow.steps, 'trigger_1');
    expect(result).toBeNull(); // This is the bug — trigger not found
  });

  it('FIX: findStep([flow.trigger, ...flow.steps], trigger_id) returns trigger', () => {
    const flow = makeFlow([email1]);
    // FIXED call site: findStep([flow.trigger, ...flow.steps], selectedStep)
    const result = findStep([flow.trigger, ...flow.steps], 'trigger_1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('trigger_1');
    expect(result?.kind).toBe('trigger');
  });

  it('findStep finds regular step regardless of call site', () => {
    const flow = makeFlow([email1]);
    expect(findStep(flow.steps, 'email_1')?.id).toBe('email_1');
    expect(findStep([flow.trigger, ...flow.steps], 'email_1')?.id).toBe('email_1');
  });

  it('findStep finds nested split child', () => {
    const child: Step = { kind: 'email', id: 'child_1', subject: '', body: '' };
    const split: Step = {
      kind: 'split', id: 'split_1',
      filters: { logic: 'and', conditions: [{ name: 'x', value: '1', predicate: 'eq' }] },
      yes: [child],
      no: [],
    };
    expect(findStep([split], 'child_1')?.id).toBe('child_1');
  });
});
