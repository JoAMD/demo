import { useCallback, useEffect, useMemo } from 'react';
import { ReactFlow, useReactFlow, type Node, type Edge, Position, type NodeMouseHandler } from '@xyflow/react';
import { useTraceStore } from '../store/traceStore';
import { useShallow } from 'zustand/react/shallow';
import { StepNode } from './StepNode';
import type { Flow, Step, FilterGroup } from '../engine/types';

const nodeTypes = { step: StepNode };

const ACCENT = '#f97316';
const MUTED = 'var(--border-color)';

const NODE_W = 172;
const NODE_H = 36;
const H_GAP = 40;
const V_GAP = 80;

function countConditions(group: FilterGroup): number {
  return group.conditions.length;
}

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

// Tree node for layout computation
type TreeNode = {
  step: Step;
  children: TreeNode[];
};

// Build tree from flow: main path + split children
function buildTree(flow: Flow): TreeNode {
  const triggerNode: TreeNode = { step: flow.trigger, children: [] };

  let current = triggerNode;
  for (const step of flow.steps) {
    const child: TreeNode = { step, children: [] };
    current.children.push(child);
    if (step.kind === 'split') {
      for (const yesChild of step.yes) {
        child.children.push(buildSubtree(yesChild));
      }
      for (const noChild of step.no) {
        child.children.push(buildSubtree(noChild));
      }
    }
    current = child;
  }
  return triggerNode;
}

function buildSubtree(step: Step): TreeNode {
  const node: TreeNode = { step, children: [] };
  if (step.kind === 'split') {
    for (const yesChild of step.yes) {
      node.children.push(buildSubtree(yesChild));
    }
    for (const noChild of step.no) {
      node.children.push(buildSubtree(noChild));
    }
  }
  return node;
}

// Compute subtree width (sum of children widths + gaps)
function subtreeWidth(node: TreeNode): number {
  if (node.children.length === 0) return NODE_W;
  let w = 0;
  for (let i = 0; i < node.children.length; i++) {
    w += subtreeWidth(node.children[i]);
    if (i < node.children.length - 1) w += H_GAP;
  }
  return Math.max(w, NODE_W);
}

// Find path from root to target step ID
function findPath(node: TreeNode, targetId: string): Set<string> | null {
  if (node.step.id === targetId) return new Set([node.step.id]);
  for (const child of node.children) {
    const path = findPath(child, targetId);
    if (path) {
      path.add(node.step.id);
      return path;
    }
  }
  return null;
}

// Position tree recursively: node centered over children
function layoutTree(node: TreeNode, x: number, y: number, positions: Map<string, { x: number; y: number }>) {
  const w = subtreeWidth(node);
  positions.set(node.step.id, { x: x + w / 2 - NODE_W / 2, y });

  if (node.children.length > 0) {
    const childrenTotalW = node.children.reduce((sum, c, i) => sum + subtreeWidth(c) + (i < node.children.length - 1 ? H_GAP : 0), 0);
    let cx = x + (w - childrenTotalW) / 2;
    for (const child of node.children) {
      const cw = subtreeWidth(child);
      layoutTree(child, cx, y + NODE_H + V_GAP, positions);
      cx += cw + H_GAP;
    }
  }
}

// Build React Flow nodes/edges with tree layout
function flowToGraph(flow: Flow, executedIds: Set<string>, selectedStep: string | null) {
  const tree = buildTree(flow);
  const positions = new Map<string, { x: number; y: number }>();
  layoutTree(tree, 0, 0, positions);

  // Path from trigger to selected step — edges on this path get full highlight
  const pathToSelected = selectedStep ? findPath(tree, selectedStep) : null;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function addNode(step: Step) {
    const pos = positions.get(step.id) ?? { x: 0, y: 0 };
    nodes.push({
      id: step.id,
      position: pos,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
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
    const onPath = pathToSelected?.has(sourceId) && pathToSelected?.has(targetId);
    const isBranch = sourceHandle === 'yes' || sourceHandle === 'no';
    edges.push({
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      type: 'step',
      zIndex: onPath ? 2 : executed ? 1 : 0,
      ...(sourceHandle ? { sourceHandle: isBranch ? 'split' : sourceHandle } : {}),
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
      style: onPath
        ? { stroke: ACCENT, strokeWidth: 2, strokeOpacity: 1 }
        : executed
        ? { stroke: ACCENT, strokeWidth: 1.5, strokeOpacity: 0.6 }
        : { stroke: MUTED, strokeWidth: 1 },
    });
  }

  function traverseTree(node: TreeNode) {
    addNode(node.step);
    for (const child of node.children) {
      const isYes = node.step.kind === 'split' && node.step.yes.some((s) => s.id === child.step.id);
      const isNo = node.step.kind === 'split' && node.step.no.some((s) => s.id === child.step.id);
      addEdge(node.step.id, child.step.id, isYes ? 'yes' : isNo ? 'no' : undefined);
      traverseTree(child);
    }
  }

  traverseTree(tree);
  // Ponytail: executed edges last → render on top of non-executed
  edges.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  return { nodes, edges };
}

export default function FlowCanvas() {
  const flow = useTraceStore(useShallow((s) => s.flow));
  const results = useTraceStore(useShallow((s) => s.results));
  const selectedStep = useTraceStore(useShallow((s) => s.selectedStep));
  const setSelectedStep = useTraceStore((s) => s.setSelectedStep);
  const { fitView } = useReactFlow();

  const executedIds = useMemo(() => new Set(results.map((r) => r.stepId)), [results]);

  // ponytail: recenter canvas when flow changes
  useEffect(() => {
    if (flow) fitView({ duration: 200 });
  }, [flow, fitView]);

  const { nodes, edges } = useMemo(() => {
    if (!flow) return { nodes: [], edges: [] };
    return flowToGraph(flow, executedIds, selectedStep);
  }, [flow, executedIds, selectedStep]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (executedIds.has(node.id)) {
        setSelectedStep(node.id);
      }
    },
    [setSelectedStep, executedIds],
  );

  if (!flow) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-secondary text-sm">No flow loaded</p>
      </div>
    );
  }

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
