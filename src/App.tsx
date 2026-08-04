import { useEffect, useCallback, useState } from 'react';
import { useTraceStore } from './store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import FlowCanvas from './components/FlowCanvas';
import JsonEditor from './components/JsonEditor';
import StepInspector from './components/StepInspector';
import TraceDock from './components/TraceDock';
import { executeTrace } from './engine/executionEngine';
import { flows } from './mocks/fixtures/flows';
import { payloads } from './mocks/fixtures/payloads';

// ponytail: theme toggle — localStorage + .light class on <html>
function getInitialLight(): boolean {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'light';
  return !window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  const [light, setLight] = useState(getInitialLight);

  useEffect(() => {
    document.documentElement.classList.toggle('light', light);
    localStorage.setItem('theme', light ? 'light' : 'dark');
  }, [light]);
  const { setFlow, setPayload, flow, payload, status, setStatus, setResults, results } =
    useTraceStore(
      useShallow((s) => ({
        setFlow: s.setFlow,
        setPayload: s.setPayload,
        flow: s.flow,
        payload: s.payload,
        status: s.status,
        setStatus: s.setStatus,
        setResults: s.setResults,
        results: s.results,
      }))
    );

  useEffect(() => {
    if (!flow && flows.length > 0) {
      setFlow(flows[0]);
      if (payloads.length > 0) setPayload(payloads[0]);
    }
  }, [flow, setFlow, setPayload]);

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

  const handleExport = useCallback(() => {
    if (!flow) return;
    const exportData = { flow, payload, results };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flow.name.replace(/\s+/g, '_').toLowerCase()}_trace.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [flow, payload, results]);

  return (
    <div className="h-screen flex flex-col bg-primary">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-sidebar">
        <h1 className="text-sm font-medium text-primary">
          {flow?.name ?? 'Nitrosend Simulator'}
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!flow || results.length === 0}
            className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </button>

          <button
            type="button"
            onClick={() => setLight((l) => !l)}
            className="p-1.5 text-secondary hover:text-primary rounded"
            aria-label="Toggle theme"
          >
            {light ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={handleRunTrace}
            disabled={isRunning || !flow}
            className="bg-[#f97316] text-white text-sm font-medium py-1.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running…' : 'Run Trace'}
          </button>
        </div>
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
