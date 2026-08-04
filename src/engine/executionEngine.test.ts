import { describe, it, expect } from 'vitest';
import { executeTrace } from './executionEngine';
import type { Flow, Step } from './types';

const trigger: Step = { kind: 'trigger', id: 'trigger_1', event: 'cart_abandoned', action_name: 'on_abandon' };

const email1: Step = { kind: 'email', id: 'email_1', subject: 'You left items', body: 'Come back!' };
const email2: Step = { kind: 'email', id: 'email_2', subject: 'Last chance', body: 'Final reminder' };

function makeFlow(trigger: Step, steps: Step[] = []): Flow {
  return { id: 1, name: 'Test Flow', status: 'draft', trigger, steps };
}

describe('executeTrace', () => {
  it('returns TraceResult with results array for each step', () => {
    const flow = makeFlow(trigger, [email1]);
    const result = executeTrace(flow, {});
    expect(result.flowId).toBe(1);
    expect(result.results).toHaveLength(2); // trigger + email1
  });

  it('linear flow (trigger → email → email) produces 3 StepResults', () => {
    // Wire trigger -> email1 -> email2 by making trigger produce email1 as next
    // Actually: trigger is first step, then we need to wire children
    // The flow structure: trigger is root, steps[0] is email1, steps[1] is email2
    // But BFS starts from flow.trigger, then enqueues children from split
    // For linear flow: trigger → email1 (next in array)
    // Let's restructure: the flow.trigger is evaluated, then steps are the children
    // Actually looking at the plan: queue starts with flow.trigger
    // For linear: trigger has no children, email1/email2 are separate steps
    // Wait - the plan says "Linear flow (trigger → email → email) produces 3 StepResults"
    // This means: trigger step, then email1, then email2
    // The flow.trigger is the first node, and steps array are the subsequent nodes
    // But how does BFS know the order? Let me re-read the plan...
    // Plan says: "Initialize queue with flow.trigger as first step"
    // Then "enqueue ALL children from step.yes or step.no based on result.branchTaken"
    // For non-split: "no children to enqueue"
    // So linear flow needs split to wire them? No...
    // Actually: the flow has trigger as root, and steps array contains the full tree
    // Let me re-read the types: Flow has trigger and steps
    // Looking at the research BFS skeleton: queue starts with [flow.trigger]
    // Then for non-split: no children enqueued
    // So for linear flow, we need to chain them somehow
    // The research example only enqueues children for split steps
    // But for linear flow, steps need to follow each other
    // Let me check if steps are children of trigger...
    // Actually the flow structure from CONTEXT/RESEARCH:
    // Flow has trigger (root) and steps (flat array)
    // The BFS processes trigger, then steps follow
    // But how? The trigger doesn't have children in the type definition
    // Wait - trigger is type: { kind: 'trigger'; id: string; event: string; action_name: string }
    // It doesn't have yes/no children like split does
    // So for linear flow: trigger → steps[0] → steps[1]
    // The steps array IS the sequence after trigger
    // Let me re-read the plan action more carefully:
    // "Initialize queue with flow.trigger as first step"
    // "While queue not empty: shift step, evaluate, push result, enqueue children"
    // For non-split: "no children to enqueue"
    // So linear flow would only process trigger (1 result), not the steps array
    // Unless... the steps array is treated as children of the previous step?
    // Actually I think the flow structure is: trigger → steps (the steps array is the tree)
    // Let me look at the Flow type: { id, name, status, trigger, steps }
    // trigger is the entry point, steps is the full tree
    // But how does the tree connect?
    // Looking at the BFS skeleton in research: it only processes from trigger
    // And for split: enqueues from step.yes and step.no
    // So for linear flow, steps need to be wired as children somehow
    // But the type definition doesn't support that for non-split steps
    // Unless the steps array IS the ordered list of all steps in the flow
    // and the trigger is separate
    // Actually I think the design is: trigger → steps[0] → steps[1] → ...
    // The steps array is ordered sequentially after trigger
    // So the engine should process: trigger, then steps[0], then steps[1], etc.
    // But the BFS skeleton only enqueues children of split steps
    // So for linear flow, we need to also enqueue steps sequentially
    // Let me re-read: "Linear flow (trigger → email → email) produces 3 StepResults"
    // This implies: trigger, email1, email2 = 3 results
    // So the engine must process the steps array in order after trigger
    // I'll implement it as: after evaluating trigger, enqueue steps[0]
    // After evaluating steps[0], enqueue steps[1], etc.
    // But that's not BFS on a tree, it's sequential processing
    // Actually wait - looking at the Flow type again:
    // trigger: Step (the entry trigger)
    // steps: Step[] (all steps in the flow, including children of splits)
    // The steps array is a flat list of ALL steps
    // So for linear: steps = [email1, email2], and they're processed in order
    // For branching: steps = [split, email1, email2] where split.yes/no reference email1/email2
    // Hmm but that doesn't match the tree structure...
    // Let me just test what makes sense and see if tests pass
    // For now: linear flow = trigger + steps array processed sequentially
    const flow: Flow = {
      id: 1, name: 'Linear', status: 'draft',
      trigger,
      steps: [email1, email2],
    };
    const result = executeTrace(flow, {});
    expect(result.results).toHaveLength(3);
    expect(result.results[0].stepId).toBe('trigger_1');
    expect(result.results[1].stepId).toBe('email_1');
    expect(result.results[2].stepId).toBe('email_2');
  });

  it('branching flow evaluates split filters and takes correct branch', () => {
    const yesEmail: Step = { kind: 'email', id: 'email_yes', subject: 'Yes path', body: '' };
    const noEmail: Step = { kind: 'email', id: 'email_no', subject: 'No path', body: '' };
    const split: Step = {
      kind: 'split', id: 'split_1',
      filters: [{ name: 'event', value: 'cart_abandoned', predicate: 'eq' }],
      yes: [yesEmail],
      no: [noEmail],
    };

    const flow: Flow = {
      id: 2, name: 'Branching', status: 'draft',
      trigger,
      steps: [split],
    };

    const result = executeTrace(flow, { event: 'cart_abandoned' });
    // trigger + split + yesEmail (yes branch taken)
    expect(result.results).toHaveLength(3);
    expect(result.results[1].branchTaken).toBe('yes');
    expect(result.results[2].stepId).toBe('email_yes');
  });

  it('split with eq predicate: "cart_abandoned" eq "cart_abandoned" → yes branch', () => {
    const split: Step = {
      kind: 'split', id: 'split_eq',
      filters: [{ name: 'event', value: 'cart_abandoned', predicate: 'eq' }],
      yes: [{ kind: 'email', id: 'yes_e', subject: '', body: '' }],
      no: [{ kind: 'email', id: 'no_e', subject: '', body: '' }],
    };
    const flow = makeFlow(trigger, [split]);
    const result = executeTrace(flow, { event: 'cart_abandoned' });
    expect(result.results[1].branchTaken).toBe('yes');
  });

  it('split with gt predicate: numeric comparison coerces to Number before compare', () => {
    const split: Step = {
      kind: 'split', id: 'split_gt',
      filters: [{ name: 'amount', value: '100', predicate: 'gt' }],
      yes: [{ kind: 'email', id: 'yes_gt', subject: '', body: '' }],
      no: [{ kind: 'email', id: 'no_gt', subject: '', body: '' }],
    };
    const flow = makeFlow(trigger, [split]);
    // String "200" should coerce to Number(200) > Number(100)
    const result = executeTrace(flow, { amount: '200' });
    expect(result.results[1].branchTaken).toBe('yes');
  });

  it('split with contains predicate: substring match on string values', () => {
    const split: Step = {
      kind: 'split', id: 'split_contains',
      filters: [{ name: 'email', value: 'gmail', predicate: 'contains' }],
      yes: [{ kind: 'email', id: 'yes_c', subject: '', body: '' }],
      no: [{ kind: 'email', id: 'no_c', subject: '', body: '' }],
    };
    const flow = makeFlow(trigger, [split]);
    const result = executeTrace(flow, { email: 'user@gmail.com' });
    expect(result.results[1].branchTaken).toBe('yes');
  });

  it('empty payload with split → filter fails → no branch taken', () => {
    const split: Step = {
      kind: 'split', id: 'split_empty',
      filters: [{ name: 'event', value: 'cart_abandoned', predicate: 'eq' }],
      yes: [{ kind: 'email', id: 'yes_e', subject: '', body: '' }],
      no: [{ kind: 'email', id: 'no_e', subject: '', body: '' }],
    };
    const flow = makeFlow(trigger, [split]);
    const result = executeTrace(flow, {});
    expect(result.results[1].branchTaken).toBe('no');
  });

  it('all StepResults have correct stepId and kind matching source step', () => {
    const split: Step = {
      kind: 'split', id: 'split_chk',
      filters: [{ name: 'x', value: '1', predicate: 'eq' }],
      yes: [{ kind: 'email', id: 'e1', subject: '', body: '' }],
      no: [],
    };
    const webhook: Step = { kind: 'webhook', id: 'wh1', url: 'https://example.com', method: 'POST' };
    const flow = makeFlow(trigger, [split, webhook]);
    const result = executeTrace(flow, { x: '1' });
    // trigger, split, e1, wh1
    expect(result.results[0]).toMatchObject({ stepId: 'trigger_1', kind: 'trigger' });
    expect(result.results[1]).toMatchObject({ stepId: 'split_chk', kind: 'split' });
    expect(result.results[2]).toMatchObject({ stepId: 'e1', kind: 'email' });
    expect(result.results[3]).toMatchObject({ stepId: 'wh1', kind: 'webhook' });
  });
});
