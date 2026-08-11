import { memo } from 'react';
import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  trigger: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>),
  email: (<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></>),
  // ponytail: split = diverging arrows, visually similar to MUI AltRoute rotated 90° CW
  split: (<><path d="M6 3v6m0 0L3 6m3 3 3-3M18 21v-6m0 0 3 3m-3-3-3 3" /></>),
  webhook: (<><path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.193-3.34a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 6.364 6.364l1.757-1.757" /></>),
};

export const NodeIcon = memo(function NodeIcon({ kind, className = 'w-4 h-4' }: { kind: string; className?: string }) {
  // ponytail: fall back to webhook icon instead of crashing on unknown kind
  const glyph = PATHS[kind] ?? PATHS.webhook;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      {glyph}
    </svg>
  );
});
