import { describe, it, expect } from 'vitest';
import { executeTrace } from './executionEngine';
import type { Flow, Step } from './types';

const trigger: Step = { kind: 'trigger', id: 'trigger_1', event: 'cart_abandoned', action_name: 'on_abandon' };

const email1: Step = { kind: 'email', id: 'email_1', subject: 'You left items', body: 'Come back!' };
const email2: Step = { kind: 'email', id: 'email_2', subject: 'Last chance', body: 'Final reminder' };

const contactPayload = { contact: { email: 'test@example.com', first_name: 'Test' } };

function makeFlow(trigger: Step, steps: Step[] = []): Flow {
  return { id: 1, name: 'Test Flow', status: 'draft', trigger, steps };
}

describe('executeTrace', () => {
  it('returns TraceResult with results array for each step', async () => {
    const flow = makeFlow(trigger, [email1]);
    const result = await executeTrace(flow, contactPayload);
    expect(result.flowId).toBe(1);
    expect(result.results).toHaveLength(2); // trigger + email1
  });

  it('linear flow (trigger → email → email) produces 3 StepResults', async () => {
    const flow: Flow = {
      id: 1, name: 'Linear', status: 'draft',
      trigger,
      steps: [email1, email2],
    };
    const result = await executeTrace(flow, contactPayload);
    expect(result.results).toHaveLength(3);
    expect(result.results[0].stepId).toBe('trigger_1');
    expect(result.results[1].stepId).toBe('email_1');
    expect(result.results[2].stepId).toBe('email_2');
  });

  it('branching flow evaluates split filters and takes correct branch', async () => {
    const yesEmail: Step = { kind: 'email', id: 'email_yes', subject: 'Yes path', body: '' };
    const noEmail: Step = { kind: 'email', id: 'email_no', subject: 'No path', body: '' };
    const split: Step = {
      kind: 'split', id: 'split_1',
      filters: { logic: 'and', conditions: [{ name: 'event', value: 'cart_abandoned', predicate: 'eq' }] },
      yes: [yesEmail],
      no: [noEmail],
    };

    const flow: Flow = {
      id: 2, name: 'Branching', status: 'draft',
      trigger,
      steps: [split],
    };

    const result = await executeTrace(flow, { ...contactPayload, event: 'cart_abandoned' });
    // trigger + split + yesEmail (yes branch taken)
    expect(result.results).toHaveLength(3);
    expect(result.results[1].branchTaken).toBe('yes');
    expect(result.results[2].stepId).toBe('email_yes');
  });

  it('split with eq predicate: "cart_abandoned" eq "cart_abandoned" → yes branch', async () => {
    const split: Step = {
      kind: 'split', id: 'split_eq',
      filters: { logic: 'and', conditions: [{ name: 'event', value: 'cart_abandoned', predicate: 'eq' }] },
      yes: [{ kind: 'email', id: 'yes_e', subject: '', body: '' }],
      no: [{ kind: 'email', id: 'no_e', subject: '', body: '' }],
    };
    const flow = makeFlow(trigger, [split]);
    const result = await executeTrace(flow, { ...contactPayload, event: 'cart_abandoned' });
    expect(result.results[1].branchTaken).toBe('yes');
  });

  it('split with gt predicate: numeric comparison coerces to Number before compare', async () => {
    const split: Step = {
      kind: 'split', id: 'split_gt',
      filters: { logic: 'and', conditions: [{ name: 'amount', value: '100', predicate: 'gt' }] },
      yes: [{ kind: 'email', id: 'yes_gt', subject: '', body: '' }],
      no: [{ kind: 'email', id: 'no_gt', subject: '', body: '' }],
    };
    const flow = makeFlow(trigger, [split]);
    // String "200" should coerce to Number(200) > Number(100)
    const result = await executeTrace(flow, { ...contactPayload, amount: '200' });
    expect(result.results[1].branchTaken).toBe('yes');
  });

  it('split with contains predicate: substring match on string values', async () => {
    const split: Step = {
      kind: 'split', id: 'split_contains',
      filters: { logic: 'and', conditions: [{ name: 'email', value: 'gmail', predicate: 'contains' }] },
      yes: [{ kind: 'email', id: 'yes_c', subject: '', body: '' }],
      no: [{ kind: 'email', id: 'no_c', subject: '', body: '' }],
    };
    const flow = makeFlow(trigger, [split]);
    const result = await executeTrace(flow, { ...contactPayload, email: 'user@gmail.com' });
    expect(result.results[1].branchTaken).toBe('yes');
  });

  it('empty payload with split → filter fails → no branch taken', async () => {
    const split: Step = {
      kind: 'split', id: 'split_empty',
      filters: { logic: 'and', conditions: [{ name: 'event', value: 'cart_abandoned', predicate: 'eq' }] },
      yes: [{ kind: 'email', id: 'yes_e', subject: '', body: '' }],
      no: [{ kind: 'email', id: 'no_e', subject: '', body: '' }],
    };
    const flow = makeFlow(trigger, [split]);
    const result = await executeTrace(flow, contactPayload);
    expect(result.results[1].branchTaken).toBe('no');
  });

  it('all StepResults have correct stepId and kind matching source step', async () => {
    const split: Step = {
      kind: 'split', id: 'split_chk',
      filters: { logic: 'and', conditions: [{ name: 'x', value: '1', predicate: 'eq' }] },
      yes: [{ kind: 'email', id: 'e1', subject: '', body: '' }],
      no: [],
    };
    const webhook: Step = { kind: 'webhook', id: 'wh1', url: 'https://example.com', method: 'POST' };
    const flow = makeFlow(trigger, [split, webhook]);
    const result = await executeTrace(flow, { ...contactPayload, x: '1' });
    // trigger, split, e1, wh1
    expect(result.results[0]).toMatchObject({ stepId: 'trigger_1', kind: 'trigger' });
    expect(result.results[1]).toMatchObject({ stepId: 'split_chk', kind: 'split' });
    expect(result.results[2]).toMatchObject({ stepId: 'e1', kind: 'email' });
    expect(result.results[3]).toMatchObject({ stepId: 'wh1', kind: 'webhook' });
  });
});
