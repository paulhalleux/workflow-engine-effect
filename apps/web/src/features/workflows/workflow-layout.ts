import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

import type { WorkflowDefinition, WorkflowExecutionDetails, WorkflowStep } from "@/domain/workflow";

import {
  createNodePresentation,
  getWorkflowNodeHeight,
  type WorkflowNodePresentation,
} from "./workflow-node-registry";

export interface WorkflowNodeData extends Record<string, unknown> {
  step: WorkflowStep;
  isEntry: boolean;
  isTerminal: boolean;
  presentation: WorkflowNodePresentation;
  runtimeStatus?: WorkflowExecutionDetails["steps"][number]["status"];
}

export const WORKFLOW_NODE_WIDTH = 292;

export function createWorkflowGraph(
  workflow: WorkflowDefinition,
  execution?: WorkflowExecutionDetails,
): {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
} {
  const graph = new dagre.graphlib.Graph({ multigraph: true }).setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    nodesep: 78,
    ranksep: 168,
    marginx: 48,
    marginy: 48,
    acyclicer: "greedy",
    ranker: "network-simplex",
  });

  const incoming = new Set(workflow.transitions.map((transition) => transition.to));
  const outgoing = new Set(workflow.transitions.map((transition) => transition.from.stepId));
  const presentations = new Map(
    workflow.steps.map((step) => [step.id, createNodePresentation(step, workflow)]),
  );
  const dataDependencies = getDataDependencies(workflow);

  for (const step of workflow.steps) {
    const presentation = presentations.get(step.id)!;
    graph.setNode(step.id, {
      width: WORKFLOW_NODE_WIDTH,
      height: getWorkflowNodeHeight(presentation),
    });
  }

  // Dagre places the first inserted sibling lower in a left-to-right graph.
  // Reverse insertion keeps declaration order top-to-bottom in the UI.
  for (const [index, transition] of [...workflow.transitions].reverse().entries()) {
    graph.setEdge(transition.from.stepId, transition.to, { weight: 3 }, `control-${index}`);
  }

  for (const [index, dependency] of dataDependencies.entries()) {
    graph.setEdge(dependency.source, dependency.target, { weight: 1 }, `data-${index}`);
  }

  dagre.layout(graph);

  const nodes = workflow.steps.map<Node<WorkflowNodeData>>((step) => {
    const position = graph.node(step.id) as { x: number; y: number };
    const presentation = presentations.get(step.id)!;
    const height = getWorkflowNodeHeight(presentation);
    return {
      id: step.id,
      type: "workflowStep",
      style: { width: WORKFLOW_NODE_WIDTH, height },
      position: {
        x: position.x - WORKFLOW_NODE_WIDTH / 2,
        y: position.y - height / 2,
      },
      data: {
        step,
        isEntry: !incoming.has(step.id),
        isTerminal: !outgoing.has(step.id),
        presentation,
        runtimeStatus: execution?.steps.find((instance) => instance.stepId === step.id)?.status,
      },
    };
  });

  const controlEdges = workflow.transitions.map<Edge>((transition, index) => ({
    id: `control-${transition.from.stepId}-${transition.to}-${index}`,
    source: transition.from.stepId,
    sourceHandle: transition.from.output ? `control:${transition.from.output}` : "control-out",
    target: transition.to,
    targetHandle: "control-in",
    label: transition.from.output,
    type: "smoothstep",
    markerEnd: { type: "arrowclosed", width: 18, height: 18, color: "var(--edge-control)" },
    style: { stroke: "var(--edge-control)", strokeWidth: 1.5 },
    labelStyle: { fontSize: 11, fontWeight: 650 },
    labelBgPadding: [7, 4],
    labelBgBorderRadius: 7,
  }));

  const dataEdges = dataDependencies.map<Edge>((dependency, index) => ({
    id: `data-${dependency.source}-${dependency.target}-${dependency.input}-${index}`,
    source: dependency.source,
    sourceHandle: `data-out:${dependency.output}`,
    target: dependency.target,
    targetHandle: `data-in:${dependency.input}`,
    type: "bezier",
    markerEnd: { type: "arrowclosed", width: 15, height: 15, color: "var(--edge-data)" },
    style: {
      stroke: "var(--edge-data)",
      strokeDasharray: "4 5",
      strokeWidth: 1.25,
    },
  }));

  return { nodes, edges: [...controlEdges, ...dataEdges] };
}

interface DataDependency {
  input: string;
  output: string;
  source: string;
  target: string;
}

function getDataDependencies(workflow: WorkflowDefinition): DataDependency[] {
  const dependencies: DataDependency[] = [];

  for (const step of workflow.steps) {
    if (step._type !== "task") continue;

    for (const [input, expression] of Object.entries(step.inputs)) {
      if (expression._type !== "TaskOutput") continue;
      dependencies.push({
        input,
        output: expression.path.join(".") || "result",
        source: expression.stepId,
        target: step.id,
      });
    }
  }

  return dependencies;
}
