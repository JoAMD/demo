import { useState, useCallback, useEffect } from 'react';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import { flows } from '../mocks/fixtures/flows';
import { payloads, payloadsByEvent } from '../mocks/fixtures/payloads';
import ContactSelector from './ContactSelector';

export default function JsonEditor() {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(payloads[0], null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  const { payload, flow, selectedContact, setFlow, setPayload } = useTraceStore(
    useShallow((state) => ({
      payload: state.payload,
      flow: state.flow,
      selectedContact: state.selectedContact,
      setFlow: state.setFlow,
      setPayload: state.setPayload,
    }))
  );

  useEffect(() => {
    const text = JSON.stringify(payload, null, 2);
    setJsonText((prev) => {
      if (prev === text) return prev;
      return text;
    });
  }, [payload]);

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

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <ContactSelector />
      <label htmlFor="flow-select" className="text-xs text-secondary">
        Template
      </label>
      <select
        id="flow-select"
        value={flow?.id ?? ''}
        onChange={(e) => {
          const selected = flows.find((f) => f.id === Number(e.target.value));
          if (selected) {
            setFlow(selected);
            if (selected.trigger.kind === 'trigger') {
              const matchingPayload = payloadsByEvent[selected.trigger.event];
              if (matchingPayload) {
                // ponytail: preserve selected contact across flow switches; fixtures omit contact
                const merged = selectedContact
                  ? { ...matchingPayload, contact: { ...selectedContact } }
                  : matchingPayload;
                setPayload(merged);
                setJsonText(JSON.stringify(merged, null, 2));
              }
            }
          }
        }}
        className="bg-card text-primary border border-border rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
        placeholder="Event payload JSON"
        aria-invalid={parseError ? 'true' : undefined}
        className={`flex-1 min-h-[200px] resize-y font-mono text-[13px] text-primary bg-card rounded-lg p-3 focus-visible:ring-2 focus-visible:ring-accent outline-none ${
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
    </div>
  );
}
