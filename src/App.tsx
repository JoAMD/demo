import { useEffect, useCallback, useState } from 'react';
import { useTraceStore } from './store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import { ReactFlowProvider } from '@xyflow/react';
import { Download, Sun, Moon } from 'lucide-react';
import FlowCanvas from './components/FlowCanvas';
import JsonEditor from './components/JsonEditor';
import StepInspector from './components/StepInspector';
import TraceDock from './components/TraceDock';
import { executeTrace } from './engine/executionEngine';
import { flows } from './mocks/fixtures/flows';
import { payloads } from './mocks/fixtures/payloads';

// ponytail: theme toggle — localStorage + .dark class on <html>
function getInitialDark(): boolean {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
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

  const handleRunTrace = useCallback(async () => {
    if (status === 'running' || !flow) return;
    setStatus('running');
    setTimeout(async () => {
      const traceResult = await executeTrace(flow, payload);
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
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
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
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Export
          </button>

          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="p-1.5 text-secondary hover:text-primary rounded"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
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
        canvas={<ReactFlowProvider><FlowCanvas /></ReactFlowProvider>}
        inspector={<StepInspector />}
        editor={<JsonEditor />}
      />
    </div>
  );
}
