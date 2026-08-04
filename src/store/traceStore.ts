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
  setFlow: (flow: Flow | null) => void;
  setPayload: (payload: Record<string, unknown>) => void;
  setResults: (results: StepResult[]) => void;
  setStatus: (status: TraceStatus) => void;
  setSelectedStep: (id: string | null) => void;
}

export const useTraceStore = create<TraceState>((set) => ({
  flow: null,
  payload: {},
  results: [],
  status: 'idle',
  selectedStep: null,
  setFlow: (flow) => set({ flow }),
  setPayload: (payload) => set({ payload }),
  setResults: (results) => set({ results }),
  setStatus: (status) => set({ status }),
  setSelectedStep: (selectedStep) => set({ selectedStep }),
}));

// Usage example (D-04):
// const { flow, results } = useTraceStore(
//   useShallow((state) => ({ flow: state.flow, results: state.results }))
// );
