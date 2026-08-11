import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NodeIcon } from './NodeIcon';

type StepNodeData = {
  label: string;
  kind: string;
  executed: boolean;
  isActive: boolean;
};

// ponytail: shared bg-card, only icon color varies per kind
const KIND_ICON_COLOR: Record<string, string> = {
  trigger: 'text-node-trigger',
  email: 'text-node-email',
  split: 'text-node-split',
  webhook: 'text-node-webhook',
};

function StepNodeComponent({ data }: NodeProps) {
  const { label, kind, executed, isActive } = data as StepNodeData;

  const iconColor = KIND_ICON_COLOR[kind] ?? KIND_ICON_COLOR.webhook;
  const baseCard = 'rounded-lg border border-border px-3 py-2 text-xs shadow-sm bg-card';
  const stateStyle = isActive
    ? 'ring-2 ring-accent ring-offset-1 ring-offset-card'
    : !executed
    ? 'opacity-50'
    : '';

  const nodeClasses = `${baseCard} ${stateStyle}`;

  return (
    <div className={nodeClasses} style={{ width: 172 }}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <NodeIcon kind={kind} className={`w-4 h-4 shrink-0 ${iconColor}`} />
        <div className="font-medium text-primary truncate flex-1 min-w-0">{label}</div>
      </div>
      {kind === 'split' ? (
        <>
          <Handle id="yes" type="source" position={Position.Left} style={{ top: '50%' }} />
          <Handle id="no" type="source" position={Position.Right} style={{ top: '50%' }} />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}

// AGENTS.md: React.memo on custom React Flow nodes
export const StepNode = memo(StepNodeComponent);
