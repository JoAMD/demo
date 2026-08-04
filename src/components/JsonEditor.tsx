import { useState, useCallback, useEffect } from 'react';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import { executeTrace } from '../engine/executionEngine';
import { flows } from '../mocks/fixtures/flows';
import { payloads } from '../mocks/fixtures/payloads';

export default function JsonEditor() {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(payloads[0], null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  const { flow, status, setFlow, setPayload, setResults, setStatus } = useTraceStore(
    useShallow((state) => ({
      flow: state.flow,
      status: state.status,
      setFlow: state.setFlow,
      setPayload: state.setPayload,
      setResults: state.setResults,
      setStatus: state.setStatus,
    }))
  );

  console.log('JsonEditor render', { flow: !!flow, status, parseError });

  useEffect(() => {
    if (!flow && flows.length > 0) setFlow(flows[0]);
  }, [flow, setFlow]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setJsonText(text);

      if (!text.trim()) {
        setParseError(null);
        return;
      }

      try {
        const parsed = JSON.parse(text);
        setPayload(parsed);
        setParseError(null);
      } catch {
        setParseError('Invalid JSON — fix syntax to run trace');
      }
    },
    [setPayload]
  );

  const handleRunTrace = useCallback(() => {
    console.log('Run Trace clicked', { parseError, status, flow: !!flow });
    if (parseError || status === 'running' || !flow) {
      console.log('Run Trace blocked', { parseError, status, flow: !!flow });
      return;
    }

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(jsonText);
    } catch {
      setParseError('Invalid JSON — fix syntax to run trace');
      return;
    }

    console.log('Running trace...', { flowId: flow.id, payload: parsedPayload });
    setStatus('running');
    try {
      setTimeout(() => {
        const traceResult = executeTrace(flow, parsedPayload);
        console.log('Trace complete', { results: traceResult.results });
        setResults(traceResult.results);
        setStatus('done');
      }, 300); // simulated delay to show button status
    } catch (err) {
      console.error('Trace error', err);
      setStatus('error');
    }
  }, [flow, jsonText, parseError, status, setResults, setStatus]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunTrace();
      }
    },
    [handleRunTrace]
  );

  const isDisabled = parseError !== null || status === 'running' || !flow;
  console.log('JsonEditor button state', { isDisabled, parseError, status, flow: !!flow });

  return (
    <div className="w-96 h-full flex flex-col gap-4 p-4">
      <label htmlFor="flow-select" className="text-xs text-secondary">
        Flow
      </label>
      <select
        id="flow-select"
        value={flow?.id ?? ''}
        onChange={(e) => {
          const selected = flows.find((f) => f.id === Number(e.target.value));
          if (selected) setFlow(selected);
        }}
        className="bg-card text-white border border-border rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {flows.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <label htmlFor="json-editor" className="text-xs text-secondary">
        Event Payload
      </label>
      <textarea
        id="json-editor"
        value={jsonText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Event payload JSON"
        aria-invalid={parseError ? 'true' : undefined}
        className={`flex-1 min-h-[200px] resize-y font-mono text-[13px] bg-card rounded-lg p-3 focus-visible:ring-2 focus-visible:ring-accent outline-none ${
          parseError
            ? 'border-error border'
            : 'border-card border'
        }`}
      />
      {parseError && (
        <p className="text-error text-xs">{parseError}</p>
      )}
      <p className="text-secondary text-xs">
        Edit and click Run Trace to evaluate
      </p>
      <button
        type="button"
        onClick={handleRunTrace}
        disabled={isDisabled}
        aria-label="Run trace evaluation"
        className="bg-accent text-white font-medium text-sm py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent"
      >
        {status === 'running' ? 'Running…' : 'Run Trace'}
      </button>
    </div>
  );
}
