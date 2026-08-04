// D-01: Step types modeled as discriminated union on `kind` field

export type Step =
  | { kind: 'email'; id: string; subject: string; body: string }
  | { kind: 'split'; id: string; filters: Filter[]; yes: Step[]; no: Step[] }
  | { kind: 'webhook'; id: string; url: string; method: string }
  | { kind: 'sms'; id: string; to: string; message: string }
  | { kind: 'trigger'; id: string; event: string; action_name: string };

export type Filter = {
  name: string;
  value: string;
  predicate: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
};

// Matches ROADMAP.md API reference exactly
export type Flow = {
  id: number;
  name: string;
  status: 'draft' | 'live';
  trigger: Step;
  steps: Step[];
};

// D-02: Flat StepResult with optional branchTaken
export type StepResult = {
  stepId: string;
  kind: Step['kind'];
  passed: boolean;
  branchTaken?: 'yes' | 'no';
};

// D-08: TraceResult
export type TraceResult = {
  flowId: number;
  results: StepResult[];
};

export type TraceStatus = 'idle' | 'running' | 'done' | 'error';
