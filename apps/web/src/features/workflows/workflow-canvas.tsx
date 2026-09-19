import { Maximize2, Minus, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Node,
} from "@xyflow/react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { WorkflowDefinition, WorkflowExecutionDetails } from "@/domain/workflow";

import { createWorkflowGraph, type WorkflowNodeData } from "./workflow-layout";
import { WorkflowNode } from "./workflow-node";

const nodeTypes = { workflowStep: WorkflowNode };

interface WorkflowCanvasProps {
  workflow: WorkflowDefinition;
  execution?: WorkflowExecutionDetails;
  onSelectNode: (nodeId: string | null) => void;
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}

function Canvas({ workflow, execution, onSelectNode }: WorkflowCanvasProps) {
  const graph = useMemo(() => createWorkflowGraph(workflow, execution), [workflow, execution]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>(graph.nodes);
  const edges = graph.edges;
  const flow = useReactFlow<Node<WorkflowNodeData>>();

  useEffect(() => {
    setNodes(graph.nodes);
  }, [graph.nodes, setNodes]);

  useEffect(() => {
    const timer = window.setTimeout(() => void flow.fitView({ padding: 0.18, duration: 500 }), 20);
    return () => window.clearTimeout(timer);
  }, [flow, workflow.name, workflow.version]);

  const zoomIn = () => void flow.zoomIn({ duration: 180 });
  const zoomOut = () => void flow.zoomOut({ duration: 180 });
  const fitView = () => void flow.fitView({ padding: 0.18, duration: 260 });

  return (
    <div className="workflow-canvas">
      <ReactFlow
        colorMode="dark"
        edges={edges}
        fitView
        maxZoom={1.5}
        minZoom={0.35}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
      >
        <Background color="var(--border)" gap={24} size={1} variant={BackgroundVariant.Dots} />
      </ReactFlow>

      <div className="canvas-controls" aria-label="Canvas controls">
        <Tooltip content="Zoom in">
          <Button size="icon" variant="ghost" onClick={zoomIn}>
            <Plus size={16} />
            <span className="sr-only">Zoom in</span>
          </Button>
        </Tooltip>
        <Tooltip content="Zoom out">
          <Button size="icon" variant="ghost" onClick={zoomOut}>
            <Minus size={16} />
            <span className="sr-only">Zoom out</span>
          </Button>
        </Tooltip>
        <span className="canvas-controls__divider" />
        <Tooltip content="Fit workflow">
          <Button size="icon" variant="ghost" onClick={fitView}>
            <Maximize2 size={15} />
            <span className="sr-only">Fit workflow</span>
          </Button>
        </Tooltip>
      </div>

      <div className="canvas-legend">
        <span>
          <i className="legend-line legend-line--control" />
          Control
        </span>
        <span>
          <i className="legend-line legend-line--data" />
          Data
        </span>
      </div>
    </div>
  );
}
