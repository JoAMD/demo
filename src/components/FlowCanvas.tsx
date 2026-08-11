import { useCallback, useMemo } from 'react';
import { ReactFlow, type Node, type Edge, Position, type NodeMouseHandler } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import { StepNode } from './StepNode';
import type { Flow, Step, FilterGroup } from '../engine/types';

const nodeTypes = { step: StepNode };

// Accent color from UI-SPEC
const ACCENT = '#f97316';
// ponytail: edge color uses CSS variable for theme support
const MUTED = 'var(--border-color)';

function countConditions(group: FilterGroup): number {
  return group.conditions.length;
}

// D-14: Simple labeled box — label derived from step kind
function stepLabel(step: Step): string {
  switch (step.kind) {
    case 'email': return step.subject;
    case 'split': return `Split (${step.filters.logic}: ${countConditions(step.filters)} conditions)`;
    case 'webhook': return step.url;
    case 'sms': return step.message;
    case 'trigger': return step.event;
    default: return 'Unnamed step';
  }
}

// Flow tree → React Flow nodes/edges with path highlight and active step
function flowToGraph(
  flow: Flow,
  executedIds: Set<string>,
  selectedStep: string | null,
): { nodes: Node[]; edges: Edge[]; branchTargets: Array<{ id: string; parentId: string; side: 'yes' | 'no' }> } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  // ponytail: defer split branch x-positioning to layout pass — needs dagre x for parent first
  const branchTargets: Array<{ id: string; parentId: string; side: 'yes' | 'no' }> = [];

  function addNode(step: Step) {
    nodes.push({
      id: step.id,
      position: { x: 0, y: 0 },
      data: {
        label: stepLabel(step),
        kind: step.kind,
        executed: executedIds.has(step.id),
        isActive: step.id === selectedStep,
      },
      type: 'step',
    });
  }

  function addEdge(sourceId: string, targetId: string, sourceHandle?: string) {
    const executed = executedIds.has(sourceId) && executedIds.has(targetId);
    const isBranch = sourceHandle === 'yes' || sourceHandle === 'no';
    edges.push({
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      ...(sourceHandle ? { sourceHandle } : {}),
      ...(isBranch
        ? {
            label: sourceHandle,
            labelStyle: { fontSize: 10, fontWeight: 600, fill: 'var(--text-primary)' },
            labelBgStyle: { fill: 'var(--bg-card)' },
            labelBgPadding: [4, 2] as [number, number],
            labelBgBorderRadius: 4,
          }
        : {}),
      animated: executed,
      style: executed
        ? { stroke: ACCENT, strokeWidth: 2 }
        : { stroke: MUTED, strokeWidth: 1 },
    });
  }

  // Recursively traverse split children, recording branch targets
  function traverseChildren(step: Step) {
    if (step.kind === 'split') {
      step.yes.forEach((child) => {
        branchTargets.push({ id: child.id, parentId: step.id, side: 'yes' });
        addEdge(step.id, child.id, 'yes');
        addNode(child);
        traverseChildren(child);
      });
      step.no.forEach((child) => {
        branchTargets.push({ id: child.id, parentId: step.id, side: 'no' });
        addEdge(step.id, child.id, 'no');
        addNode(child);
        traverseChildren(child);
      });
    }
  }

  // Root: trigger
  addNode(flow.trigger);

  // Connect trigger → first step, then each step to next
  flow.steps.forEach((step, i) => {
    addNode(step);
    const parentId = i === 0 ? flow.trigger.id : flow.steps[i - 1].id;
    addEdge(parentId, step.id);
    traverseChildren(step);
  });

  return { nodes, edges, branchTargets };
}

// D-13: dagre auto-layout, rankdir TB, 172×36 per node
const NODE_W = 172;
const NODE_H = 36;

// ponytail: branch x-offset computed after dagre — needs parent's dagre x
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  branchTargets: Array<{ id: string; parentId: string; side: 'yes' | 'no' }> = [],
) {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 50 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const offset = NODE_W + 40; // 212px between yes/no branches
  const xOverride: Record<string, number> = {};
  for (const { id, parentId, side } of branchTargets) {
    const parentX = g.node(parentId)?.x ?? 0;
    xOverride[id] = parentX + (side === 'yes' ? -offset : offset);
  }

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id);
      const x = xOverride[n.id] ?? pos.x - NODE_W / 2;
      return {
        ...n,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        position: { x, y: pos.y - NODE_H / 2 },
      };
    }),
    edges,
  };
}

export default function FlowCanvas() {
  const flow = useTraceStore(useShallow((s) => s.flow));
  const results = useTraceStore(useShallow((s) => s.results));
  const selectedStep = useTraceStore(useShallow((s) => s.selectedStep));
  const setSelectedStep = useTraceStore((s) => s.setSelectedStep);

  // Derived set of executed step IDs — memoized on results
  const executedIds = useMemo(() => new Set(results.map((r) => r.stepId)), [results]);

  // Memoize layout computation — only recomputes when flow, results, or selection change
  const { nodes, edges } = useMemo(() => {
    if (!flow) return { nodes: [], edges: [] };
    const graph = flowToGraph(flow, executedIds, selectedStep);
    return getLayoutedElements(graph.nodes, graph.edges, graph.branchTargets);
  }, [flow, executedIds, selectedStep]);

  // D-04: Clicking a node jumps the step inspector to that step
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (executedIds.has(node.id)) {
        setSelectedStep(node.id);
      }
    },
    [setSelectedStep, executedIds],
  );

  // Empty state: "No flow loaded" centered
  if (!flow) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-secondary text-sm">No flow loaded</p>
      </div>
    );
  }

  // D-15: fitView on load, zoom 0.2–2.0
  return (
    <div className="flex-1 min-h-0" style={{ backgroundColor: 'var(--bg-primary)', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.2}
        maxZoom={2.0}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
