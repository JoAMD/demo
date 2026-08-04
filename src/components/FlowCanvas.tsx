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
const MUTED = '#2a2a2a';

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
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

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

  function addEdge(sourceId: string, targetId: string, label?: string) {
    const executed = executedIds.has(sourceId) && executedIds.has(targetId);
    edges.push({
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      animated: executed,
      label: label,
      labelStyle: { fill: '#a1a1aa', fontSize: 10 },
      labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.8 },
      labelBgPadding: [4, 2] as [number, number],
      style: executed
        ? { stroke: ACCENT, strokeWidth: 2 }
        : { stroke: MUTED, strokeWidth: 1 },
    });
  }

  // Recursively traverse split children
  function traverseChildren(step: Step) {
    if (step.kind === 'split') {
      step.yes.forEach((child) => {
        addEdge(step.id, child.id, 'yes');
        addNode(child);
        traverseChildren(child);
      });
      step.no.forEach((child) => {
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

  return { nodes, edges };
}

// D-13: dagre auto-layout, rankdir TB, 172×36 per node
const NODE_W = 172;
const NODE_H = 36;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB' });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id);
      return {
        ...n,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
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
    return getLayoutedElements(graph.nodes, graph.edges);
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
      <div className="flex-1 flex items-center justify-center bg-primary min-h-0">
        <p className="text-secondary text-sm">No flow loaded</p>
      </div>
    );
  }

  // D-15: fitView on load, zoom 0.2–2.0
  return (
    <div className="flex-1 bg-primary min-h-0" style={{ height: '100%' }}>
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
