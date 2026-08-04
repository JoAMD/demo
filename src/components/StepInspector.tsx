import { useMemo, useCallback, useState } from 'react';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import type { Step, StepResult } from '../engine/types';

function findStep(steps: Step[], id: string): Step | null {
  for (const s of steps) {
    if (s.id === id) return s;
    if (s.kind === 'split') return findInSplit(s, id);
  }
  return null;
}

function findInSplit(split: Extract<Step, { kind: 'split' }>, id: string): Step | null {
  return findStep(split.yes, id) ?? findStep(split.no, id);
}

function StepContent({ step, result }: { step: Step; result: StepResult }) {
  switch (step.kind) {
    case 'email':
      return <EmailPreview step={step} />;
    case 'split':
      return <SplitPreview step={step} result={result} />;
    case 'webhook':
      return (
        <div className="text-[14px] text-[#a1a1aa]">
          <span className="text-white">URL:</span> {step.url}
        </div>
      );
    case 'sms':
      return (
        <div className="text-[14px] text-[#a1a1aa]">
          <span className="text-white">Message:</span> {step.message}
        </div>
      );
    case 'trigger':
      return (
        <div className="text-[14px] text-[#a1a1aa]">
          <span className="text-white">Event:</span> {step.event}
        </div>
      );
  }
}

function EmailPreview({ step }: { step: Extract<Step, { kind: 'email' }> }) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => setShowRaw(false)}
          className={`text-[12px] px-2 py-0.5 rounded ${
            !showRaw
              ? 'bg-[#f97316] text-white'
              : 'bg-[#1e1e1e] text-[#a1a1aa] border border-[#2a2a2a]'
          }`}
        >
          Rendered
        </button>
        <button
          type="button"
          onClick={() => setShowRaw(true)}
          className={`text-[12px] px-2 py-0.5 rounded ${
            showRaw
              ? 'bg-[#f97316] text-white'
              : 'bg-[#1e1e1e] text-[#a1a1aa] border border-[#2a2a2a]'
          }`}
        >
          Raw HTML
        </button>
      </div>
      {showRaw ? (
        <textarea
          readOnly
          value={step.body}
          className="flex-1 font-mono text-[13px] text-[#a1a1aa] bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2 resize-none"
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-[16px] font-semibold text-white mb-2">
            {step.subject}
          </h4>
          <div
            className="text-[14px] text-[#a1a1aa]"
            dangerouslySetInnerHTML={{ __html: step.body }}
          />
        </div>
      )}
    </div>
  );
}

function SplitPreview({
  step,
  result,
}: {
  step: Extract<Step, { kind: 'split' }>;
  result: StepResult;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] bg-[#f97316] text-white rounded-full px-2 py-0.5 self-start">
        Branch: {result.branchTaken}
      </span>
      {step.filters.map((filter) => (
        <div
          key={filter.name}
          className="flex items-center justify-between text-[14px] py-1 border-b border-[#2a2a2a] last:border-0"
        >
          <span
            className="font-mono text-[#a1a1aa]"
            title={`Source: ${filter.name}`}
          >
            {filter.name} {filter.predicate} {filter.value}
          </span>
          <span
            className={`text-[12px] rounded-full px-2 py-0.5 ${
              result.passed
                ? 'bg-[#22c55e]/10 text-[#22c55e]'
                : 'bg-[#ef4444]/10 text-[#ef4444]'
            }`}
          >
            {result.passed ? 'PASS' : 'FAIL'}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <h2 className="text-[20px] font-semibold text-white">
        Run a trace to see results
      </h2>
      <p className="text-[14px] text-[#a1a1aa] mt-2 text-center">
        Enter an event payload and click Run Trace to see how your flow
        evaluates.
      </p>
    </div>
  );
}

function StepNotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <p className="text-[14px] text-[#a1a1aa]">Step not found</p>
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
        <h3 className="text-[16px] font-semibold text-white">{step.id}</h3>
        <span className="text-[12px] text-[#a1a1aa] rounded-full px-2 py-0.5 bg-[#1e1e1e] border border-[#2a2a2a]">
          {step.kind}
        </span>
        <span
          className={`text-[12px] rounded-full px-2 py-0.5 ${
            result.passed
              ? 'bg-[#22c55e]/10 text-[#22c55e]'
              : 'bg-[#ef4444]/10 text-[#ef4444]'
          }`}
        >
          {result.passed ? 'PASS' : 'FAIL'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <StepContent step={step} result={result} />
      </div>

      <div className="flex justify-between pt-3 border-t border-[#2a2a2a]">
        <button
          type="button"
          onClick={onPrev}
          disabled={stepIndex <= 0}
          className="text-[14px] text-[#a1a1aa] disabled:opacity-30 disabled:cursor-not-allowed hover:text-white"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={stepIndex >= totalSteps - 1}
          className="text-[14px] text-[#a1a1aa] disabled:opacity-30 disabled:cursor-not-allowed hover:text-white"
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
    return findStep(flow.steps, selectedStep);
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
