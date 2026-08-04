import { useEffect, useCallback } from 'react';
import { useTraceStore } from './store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import FlowCanvas from './components/FlowCanvas';
import JsonEditor from './components/JsonEditor';
import StepInspector from './components/StepInspector';
import ContactSelector from './components/ContactSelector';
import TraceDock from './components/TraceDock';
import { executeTrace } from './engine/executionEngine';
import { flows } from './mocks/fixtures/flows';

export default function App() {
  const { setFlow, flow, payload, status, setStatus, setResults } =
    useTraceStore(
      useShallow((s) => ({
        setFlow: s.setFlow,
        flow: s.flow,
        payload: s.payload,
        status: s.status,
        setStatus: s.setStatus,
        setResults: s.setResults,
      }))
    );

  useEffect(() => {
    if (!flow && flows.length > 0) setFlow(flows[0]);
  }, [flow, setFlow]);

  const handleRunTrace = useCallback(() => {
    if (status === 'running' || !flow) return;
    setStatus('running');
    setTimeout(() => {
      const traceResult = executeTrace(flow, payload);
      setResults(traceResult.results);
      setStatus('done');
    }, 300);
  }, [flow, payload, status, setStatus, setResults]);

  const isRunning = status === 'running';

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <h1 className="text-sm font-medium text-white">
          {flow?.name ?? 'Nitrosend Simulator'}
        </h1>

        <ContactSelector />

        <button
          type="button"
          onClick={handleRunTrace}
          disabled={isRunning || !flow}
          className="bg-[#f97316] text-white text-sm font-medium py-1.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running…' : 'Run Trace'}
        </button>
      </div>

      {/* Content */}
      <TraceDock
        canvas={<FlowCanvas />}
        inspector={<StepInspector />}
        editor={<JsonEditor />}
      />
    </div>
  );
}
