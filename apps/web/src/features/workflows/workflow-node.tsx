import { Braces } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/cn";

import type { WorkflowNodeData } from "./workflow-layout";

type HandleKind = "branch" | "data" | "none";

export function WorkflowNode({ data, selected }: NodeProps) {
  const { step, isEntry, isTerminal, presentation, runtimeStatus } = data as WorkflowNodeData;
  const Icon = presentation.icon;

  return (
    <article
      className={cn(
        "workflow-node",
        `workflow-node--${step._type}`,
        `workflow-node--${presentation.accent}`,
        runtimeStatus && `workflow-node--status-${runtimeStatus.toLowerCase()}`,
        selected && "is-selected",
      )}
    >
      {!isEntry && (
        <Handle
          className="workflow-handle workflow-handle--control workflow-handle--control-in"
          id="control-in"
          position={Position.Left}
          type="target"
        />
      )}
      <div className="workflow-node__topline" />
      <header>
        <span className="workflow-node__icon">
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <span className="workflow-node__type">{presentation.label}</span>
        {runtimeStatus && <span className="workflow-node__runtime-status">{runtimeStatus}</span>}
        {isEntry && <span className="workflow-node__marker">Start</span>}
        {isTerminal && <span className="workflow-node__marker">End</span>}
      </header>
      <div className="workflow-node__body">
        <h3>{step.name}</h3>
        <p>{step.description ?? presentation.detail}</p>
      </div>
      <div className="workflow-node__ports">
        <PortColumn
          handleKind={presentation.inputHandles}
          label="Inputs"
          ports={presentation.inputs}
        />
        <PortColumn
          align="right"
          handleKind={presentation.outputHandles}
          label="Outputs"
          ports={presentation.outputs}
        />
      </div>
      <footer>
        <Braces size={12} />
        <code>{step.id}</code>
        <span>{presentation.detail}</span>
      </footer>
      {!isTerminal && presentation.outputHandles !== "branch" && (
        <Handle
          className="workflow-handle workflow-handle--control workflow-handle--control-out"
          id="control-out"
          position={Position.Right}
          type="source"
        />
      )}
    </article>
  );
}

function PortColumn({
  align = "left",
  handleKind = "none",
  label,
  ports,
}: {
  align?: "left" | "right";
  handleKind?: HandleKind;
  label: string;
  ports: WorkflowNodeData["presentation"]["inputs"];
}) {
  return (
    <div className={cn("workflow-node__port-column", `is-${align}`)}>
      <span className="workflow-node__port-heading">{label}</span>
      {ports.map((port) => (
        <div className="workflow-node__port" key={port.id} title={port.description}>
          <span>{port.label}</span>
          {port.description && <small>{port.description}</small>}
          {handleKind !== "none" && (
            <Handle
              className={cn(
                "workflow-handle",
                handleKind === "branch" ? "workflow-handle--branch" : "workflow-handle--data",
                `workflow-handle--${align}`,
              )}
              id={getPortHandleId(handleKind, port.id, align)}
              position={align === "left" ? Position.Left : Position.Right}
              type={align === "left" ? "target" : "source"}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function getPortHandleId(kind: Exclude<HandleKind, "none">, portId: string, align: string) {
  if (kind === "branch") return `control:${portId}`;
  return align === "left" ? `data-in:${portId}` : `data-out:${portId}`;
}
