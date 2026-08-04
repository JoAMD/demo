import { useMemo, useCallback, useState } from 'react';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import type { Step, StepResult, Filter, FilterGroup } from '../engine/types';

export function findStep(steps: Step[], id: string): Step | null {
  for (const s of steps) {
    if (s.id === id) return s;
    if (s.kind === 'split') return findInSplit(s, id);
  }
  return null;
}

function findInSplit(split: Extract<Step, { kind: 'split' }>, id: string): Step | null {
  return findStep(split.yes, id) ?? findStep(split.no, id);
}

function stepTitle(step: Step): string {
  switch (step.kind) {
    case 'email': return step.subject;
    case 'split': {
      const field = step.filters.conditions.find((condition) => !('logic' in condition));
      const name = field && !('logic' in field)
        ? field.name.split('.').pop()?.replace(/_/g, ' ')
        : 'condition';
      return `${name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Condition'} Split`;
    }
    case 'webhook': return `Webhook: ${step.url}`;
    case 'sms': return `SMS: ${step.to}`;
    case 'trigger': return step.action_name;
  }
}

function StepContent({ step, result }: { step: Step; result: StepResult }) {
  const payload = useTraceStore(useShallow((s) => s.payload));

  switch (step.kind) {
    case 'email':
      return <EmailPreview step={step} />;
    case 'split':
      return <SplitPreview step={step} result={result} />;
    case 'webhook':
      return (
        <div className="text-[14px] text-secondary">
          <span className="text-primary">URL:</span> {step.url}
        </div>
      );
    case 'sms':
      return (
        <div className="text-[14px] text-secondary">
          <span className="text-primary">Message:</span> {step.message}
        </div>
      );
    case 'trigger':
      return (
        <div className="text-[14px] text-secondary">
          <span className="text-primary">Event:</span> {step.event}
          {Object.keys(payload).length === 0 && (
            <div className="mt-2 text-[12px] text-muted italic">No payload provided</div>
          )}
        </div>
      );
  }
}

function EmailPreview({ step }: { step: Extract<Step, { kind: 'email' }> }) {
  const [showRaw, setShowRaw] = useState(false);
  const payload = useTraceStore(useShallow((s) => s.payload));

  const resolvedSubject = step.subject.replace(/\{\{(.+?)\}\}/g, (_, path) => {
    const val = path.split('.').reduce((obj: unknown, key: string) => {
      if (obj === null || obj === undefined) return undefined;
      return (obj as Record<string, unknown>)[key];
    }, payload);
    return val !== undefined ? String(val) : `{{${path.trim()}}}`;
  });

  const resolvedBody = step.body.replace(/\{\{(.+?)\}\}/g, (_, path) => {
    const val = path.split('.').reduce((obj: unknown, key: string) => {
      if (obj === null || obj === undefined) return undefined;
      return (obj as Record<string, unknown>)[key];
    }, payload);
    return val !== undefined ? String(val) : `{{${path.trim()}}}`;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => setShowRaw(false)}
          className={`text-[12px] px-2 py-0.5 rounded ${
            !showRaw
              ? 'bg-accent text-white'
              : 'bg-card text-secondary border border-border'
          }`}
        >
          Rendered
        </button>
        <button
          type="button"
          onClick={() => setShowRaw(true)}
          className={`text-[12px] px-2 py-0.5 rounded ${
            showRaw
              ? 'bg-accent text-white'
              : 'bg-card text-secondary border border-border'
          }`}
        >
          Raw HTML
        </button>
      </div>
      {showRaw ? (
        <textarea
          readOnly
          value={step.body}
          className="flex-1 font-mono text-[13px] text-secondary border border-border rounded p-2 resize-none"
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 my-4">
            <h4 className="text-[16px] font-semibold text-gray-900 mb-2">
              {resolvedSubject}
            </h4>
            <div
              className="text-[14px] text-gray-700 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: resolvedBody }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterCondition({ condition, depth = 0 }: { condition: Filter | FilterGroup; depth?: number }) {
  if ('logic' in condition) {
    return (
      <div className={`ml-${depth * 4}`}>
        <span className="text-[11px] text-accent font-medium uppercase">
          {condition.logic}
        </span>
        <div className="flex flex-col gap-1 mt-1">
          {condition.conditions.map((c, i) => (
            <FilterCondition key={i} condition={c} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex items-center text-[14px] py-1 border-b border-border last:border-0 ml-${depth * 4}`}>
      <span className="font-mono text-secondary">
        {condition.name} {condition.predicate} {condition.value}
      </span>
    </div>
  );
}

function flattenConditions(group: FilterGroup): Filter[] {
  const out: Filter[] = [];
  for (const c of group.conditions) {
    if ('logic' in c) out.push(...flattenConditions(c));
    else out.push(c);
  }
  return out;
}

function SplitPreview({
  step,
  result,
}: {
  step: Extract<Step, { kind: 'split' }>;
  result: StepResult;
}) {
  const filters = flattenConditions(step.filters);
  const conditions = result.conditionResults ?? [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[12px] bg-accent text-white rounded-full px-2 py-0.5">
          Branch: {result.branchTaken}
        </span>
        <span className="text-[12px] text-secondary">
          {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
        </span>
        <span className="text-[11px] text-accent uppercase">
          {step.filters.logic}
        </span>
      </div>
      {result.error && (
        <span className="text-[12px] text-error">{result.error}</span>
      )}
      {conditions.map((cr, i) => {
        const filter = filters[i];
        return (
          <div
            key={`${cr.name}-${i}`}
            className="flex items-center justify-between text-[13px] py-1.5 border-b border-border last:border-0"
          >
            <span className="font-mono text-secondary">
              {cr.name} {filter?.predicate} {filter?.value}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-muted">
                → {cr.value === undefined ? 'undefined' : String(cr.value)}
              </span>
                <span
                  className={`text-[11px] rounded-full px-1.5 py-0.5 border ${
                    cr.passed
                      ? 'border-[#60a5fa]/40 bg-[#60a5fa]/10 text-[#60a5fa]'
                      : 'border-[#a1a1aa]/40 bg-[#a1a1aa]/10 text-secondary'
                  }`}
                >
                  {cr.passed ? 'TRUE' : 'FALSE'}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <h2 className="text-[20px] font-semibold text-primary">
        Run a trace to see results
      </h2>
      <p className="text-[14px] text-secondary mt-2 text-center">
        Enter an event payload and click Run Trace to see how your flow
        evaluates.
      </p>
    </div>
  );
}

function StepNotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <p className="text-[14px] text-secondary">Step not in trace results</p>
      <p className="text-[12px] text-muted mt-1">Run a trace or select an executed step</p>
    </div>
  );
}

function StepDetail({
  step,
  result,
  stepIndex,
  totalSteps,
  onPrev,
  onNext,
  onKeyDown,
}: {
  step: Step;
  result: StepResult;
  stepIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div
      className="h-full flex flex-col p-4"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[16px] font-semibold text-primary">{stepTitle(step)}</h3>
        <span className="text-[12px] text-secondary rounded-full px-2 py-0.5 bg-card border border-border">
          {step.kind}
        </span>
        <span
          className={`text-[12px] rounded-full px-2 py-0.5 ${
            result.passed
              ? 'bg-success/10 text-success'
              : 'bg-error/10 text-error'
          }`}
        >
          {result.passed ? 'PASS' : 'FAIL'}
        </span>
        {result.error && (
          <span className="text-[12px] text-error ml-2">
            {result.error}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <StepContent step={step} result={result} />
      </div>

      <div className="flex justify-between pt-3 border-t border-border">
        <button
          type="button"
          onClick={onPrev}
          disabled={stepIndex <= 0}
          className="text-[14px] text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:text-primary"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={stepIndex >= totalSteps - 1}
          className="text-[14px] text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:text-primary"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function StepInspector() {
  const { results, selectedStep, flow, nextStep, prevStep } = useTraceStore(
    useShallow((s) => ({
      results: s.results,
      selectedStep: s.selectedStep,
      flow: s.flow,
      nextStep: s.nextStep,
      prevStep: s.prevStep,
    }))
  );

  const stepResult = useMemo(
    () => results.find((r) => r.stepId === selectedStep) ?? null,
    [results, selectedStep]
  );

  const step = useMemo(() => {
    if (!flow || !selectedStep) return null;
    return findStep([flow.trigger, ...flow.steps], selectedStep);
  }, [flow, selectedStep]);

  const stepIndex = useMemo(
    () => results.findIndex((r) => r.stepId === selectedStep),
    [results, selectedStep]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevStep();
      else if (e.key === 'ArrowRight') nextStep();
    },
    [nextStep, prevStep]
  );

  if (results.length === 0 || !selectedStep) return <EmptyState />;
  if (!step || !stepResult) return <StepNotFound />;

  return (
    <StepDetail
      step={step}
      result={stepResult}
      stepIndex={stepIndex}
      totalSteps={results.length}
      onPrev={prevStep}
      onNext={nextStep}
      onKeyDown={handleKeyDown}
    />
  );
}
