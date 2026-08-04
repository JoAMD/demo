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
      ? 'border-accent border-l-[3px] bg-card text-primary'
      : 'border-border bg-card text-primary',
    !executed && !isActive ? 'opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={nodeClasses} style={{ width: 172 }}>
      <Handle type="target" position={Position.Top} />
      <div className="font-medium text-center truncate">{label}</div>
      <div className="text-xs text-secondary text-center">{kind}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// AGENTS.md: React.memo on custom React Flow nodes
export const StepNode = memo(StepNodeComponent);
