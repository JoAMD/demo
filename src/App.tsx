import { useEffect } from 'react';
import { useTraceStore } from './store/traceStore';
import FlowCanvas from './components/FlowCanvas';
import JsonEditor from './components/JsonEditor';
import { flows } from './mocks/fixtures/flows';

export default function App() {
  // Blocker 2 fix: load default flow fixture on mount
  const setFlow = useTraceStore((s) => s.setFlow);

  useEffect(() => {
    setFlow(flows[0]);
  }, [setFlow]);

  // UI-SPEC Layout Skeleton: header + two-column flex
  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <h1 className="text-sm font-medium text-white">Nitrosend Simulator</h1>
      </div>

      {/* Content row: canvas left, editor right */}
      <div className="flex flex-1 overflow-hidden">
        <FlowCanvas />
        <div className="w-96 h-full border-l border-[#2a2a2a]">
          <JsonEditor />
        </div>
      </div>
    </div>
  );
}
