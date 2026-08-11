import { memo } from 'react';
import { Mail, Zap, Split, Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  trigger: Flag,
  email: Mail,
  split: Split,
  webhook: Zap,
};

// ponytail: split icon rotated 90deg, color from className
export const NodeIcon = memo(function NodeIcon({ kind, className = 'w-4 h-4' }: { kind: string; className?: string }) {
  const Icon = ICONS[kind] ?? ICONS.webhook;
  const isSplit = kind === 'split';
  return (
    <Icon
      className={`${className}${isSplit ? ' -rotate-270' : ''}`}
      strokeWidth={1.5}
    />
  );
});
