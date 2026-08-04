import { useState, useCallback } from 'react';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import { executeTrace } from '../engine/executionEngine';

export default function JsonEditor() {
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const { flow, status, setPayload, setResults, setStatus } = useTraceStore(
    useShallow((state) => ({
      flow: state.flow,
      status: state.status,
      setPayload: state.setPayload,
      setResults: state.setResults,
      setStatus: state.setStatus,
    }))
  );

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
    if (parseError || status === 'running' || !flow) return;

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(jsonText);
    } catch {
      setParseError('Invalid JSON — fix syntax to run trace');
      return;
    }

    setStatus('running');
    try {
      const traceResult = executeTrace(flow, parsedPayload);
      setResults(traceResult.results);
      setStatus('done');
    } catch {
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

  return (
    <div className="w-96 flex flex-col gap-4 p-4">
      <label htmlFor="json-editor" className="text-xs text-secondary">
        Event Payload
      </label>
      <textarea
        id="json-editor"
        value={jsonText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Paste event payload JSON here…"
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
