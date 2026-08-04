import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

type StepNodeData = {
  label: string;
  kind: string;
};

function StepNodeComponent({ data }: NodeProps) {
  const { label, kind } = data as StepNodeData;
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-2 text-sm text-white">
      <Handle type="target" position={Position.Top} />
      <div className="font-medium">{label}</div>
      <div className="text-xs text-[#a1a1aa]">{kind}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// AGENTS.md: React.memo on custom React Flow nodes
export const StepNode = memo(StepNodeComponent);
