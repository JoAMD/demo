import { useMemo } from 'react';
import { ReactFlow, type Node, type Edge, Position } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import { StepNode } from './StepNode';
import type { Flow, Step } from '../engine/types';

const nodeTypes = { step: StepNode };

// D-14: Simple labeled box — label derived from step kind
function stepLabel(step: Step): string {
  switch (step.kind) {
    case 'email': return step.subject;
    case 'split': return `Split (${step.filters.length} conditions)`;
    case 'webhook': return step.url;
    case 'sms': return step.message;
    case 'trigger': return step.event;
    default: return 'Unnamed step';
  }
}

// Flow tree → React Flow nodes/edges
function flowToGraph(flow: Flow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function addNode(step: Step) {
    nodes.push({
      id: step.id,
      position: { x: 0, y: 0 },
      data: { label: stepLabel(step), kind: step.kind },
      type: 'step',
    });
  }

  function addEdge(sourceId: string, targetId: string) {
    edges.push({ id: `${sourceId}-${targetId}`, source: sourceId, target: targetId });
  }

  // Recursively traverse split children
  function traverseChildren(step: Step) {
    if (step.kind === 'split') {
      step.yes.forEach((child) => {
        addEdge(step.id, child.id);
        addNode(child);
        traverseChildren(child);
      });
      step.no.forEach((child) => {
        addEdge(step.id, child.id);
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

  // Memoize layout computation — only recomputes when flow changes
  const { nodes, edges } = useMemo(() => {
    if (!flow) return { nodes: [], edges: [] };
    const graph = flowToGraph(flow);
    return getLayoutedElements(graph.nodes, graph.edges);
  }, [flow]);

  // Empty state: "No flow loaded" centered
  if (!flow) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-primary">
        <p className="text-secondary text-sm">No flow loaded</p>
      </div>
    );
  }

  // D-15: fitView on load, zoom 0.2–2.0
  return (
    <div className="flex-1 h-full bg-primary">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2.0}
      />
    </div>
  );
}
