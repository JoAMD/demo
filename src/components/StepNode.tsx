import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

type StepNodeData = {
  label: string;
  kind: string;
  executed: boolean;
  isActive: boolean;
};

function StepNodeComponent({ data }: NodeProps) {
  const { label, kind, executed, isActive } = data as StepNodeData;

  const nodeClasses = [
    'rounded-lg border px-4 py-2 text-sm',
    isActive
      ? 'border-[#f97316] border-l-[3px] bg-[#1e1e1e] text-white'
      : 'border-[#2a2a2a] bg-[#1e1e1e]',
    !executed && !isActive ? 'opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={nodeClasses}>
      <Handle type="target" position={Position.Top} />
      <div className="font-medium">{label}</div>
      <div className="text-xs text-[#a1a1aa]">{kind}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// AGENTS.md: React.memo on custom React Flow nodes
export const StepNode = memo(StepNodeComponent);
