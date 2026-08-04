import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Flow, StepResult, TraceStatus } from '../engine/types';

// D-03: Single Zustand traceStore
// D-04: All consumers MUST use useShallow for multi-field selectors to prevent
// unnecessary re-renders from object reference changes.
export interface TraceState {
  flow: Flow | null;
  payload: Record<string, unknown>;
  results: StepResult[];
  status: TraceStatus;
  selectedStep: string | null;
  stepCount: number;
  currentStepIndex: number;
  setFlow: (flow: Flow | null) => void;
  setPayload: (payload: Record<string, unknown>) => void;
  setResults: (results: StepResult[]) => void;
  setStatus: (status: TraceStatus) => void;
  setSelectedStep: (id: string | null) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useTraceStore = create<TraceState>((set, get) => ({
  flow: null,
  payload: {},
  results: [],
  status: 'idle',
  selectedStep: null,
  stepCount: 0,
  currentStepIndex: 0,
  setFlow: (flow) => set({ flow }),
  setPayload: (payload) => set({ payload }),
  setResults: (results) => {
    const firstId = results[0]?.stepId ?? null;
    set({ results, stepCount: results.length, currentStepIndex: 0, selectedStep: firstId });
  },
  setStatus: (status) => set({ status }),
  setSelectedStep: (selectedStep) => {
    const idx = get().results.findIndex((r) => r.stepId === selectedStep);
    set({ selectedStep, currentStepIndex: idx >= 0 ? idx : 0 });
  },
  nextStep: () => {
    const { results, currentStepIndex } = get();
    if (currentStepIndex < results.length - 1) {
      const next = currentStepIndex + 1;
      set({ currentStepIndex: next, selectedStep: results[next].stepId });
    }
  },
  prevStep: () => {
    const { results, currentStepIndex } = get();
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      set({ currentStepIndex: prev, selectedStep: results[prev].stepId });
    }
  },
}));

// Usage example (D-04):
// const { flow, results } = useTraceStore(
//   useShallow((state) => ({ flow: state.flow, results: state.results }))
// );
