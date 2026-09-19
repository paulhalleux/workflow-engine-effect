import { Merge, Route, Split, TerminalSquare, type LucideIcon } from "lucide-react";

import type { StepType, WorkflowDefinition, WorkflowStep } from "@/domain/workflow";

export interface WorkflowNodePort {
  id: string;
  label: string;
  description?: string;
}

export interface WorkflowNodePresentation {
  accent: "mint" | "amber" | "violet" | "blue";
  detail: string;
  icon: LucideIcon;
  inputHandles: "data" | "none";
  inputs: readonly WorkflowNodePort[];
  label: string;
  outputHandles: "branch" | "data" | "none";
  outputs: readonly WorkflowNodePort[];
}

interface PresentationContext {
  incomingStepIds: readonly string[];
  outgoingStepIds: readonly string[];
  referencedOutputs: readonly string[];
}

interface NodeTypeDefinition {
  accent: WorkflowNodePresentation["accent"];
  icon: LucideIcon;
  label: string;
  present: (
    step: WorkflowStep,
    context: PresentationContext,
  ) => Omit<WorkflowNodePresentation, "accent" | "icon" | "label">;
}

/**
 * UI extension point for workflow step types. Adding a type requires one
 * registry entry; TypeScript reports a missing entry when the API union grows.
 */
export const workflowNodeRegistry = {
  task: {
    accent: "mint",
    icon: TerminalSquare,
    label: "Task",
    present: (step, context) => {
      if (step._type !== "task") return emptyPresentation;

      return {
        detail: step.taskId,
        inputHandles: "data",
        inputs: Object.keys(step.inputs).map((name) => ({ id: name, label: name })),
        outputHandles: "data",
        outputs: (context.referencedOutputs.length
          ? context.referencedOutputs
          : ["completion"]
        ).map((name) => ({ id: name, label: name })),
      };
    },
  },
  decision: {
    accent: "amber",
    icon: Route,
    label: "Decision",
    present: (step) => {
      if (step._type !== "decision") return emptyPresentation;

      return {
        detail: step.mode,
        inputHandles: "none",
        inputs: [{ id: "context", label: "workflow context" }],
        outputHandles: "branch",
        outputs: [
          ...step.branches.map((branch) => ({
            id: branch.output,
            label: branch.output,
            description: branch.condition,
          })),
          ...(step.defaultOutput
            ? [{ id: step.defaultOutput, label: step.defaultOutput, description: "default" }]
            : []),
        ],
      };
    },
  },
  fork: {
    accent: "violet",
    icon: Split,
    label: "Fork",
    present: (_step, context) => ({
      detail: "parallel paths",
      inputHandles: "none",
      inputs: flowInputs(context.incomingStepIds),
      outputHandles: "none",
      outputs: context.outgoingStepIds.map((id) => ({ id, label: id })),
    }),
  },
  join: {
    accent: "blue",
    icon: Merge,
    label: "Join",
    present: (step, context) => ({
      detail: step._type === "join" ? `wait for ${step.mode ?? "all"}` : "wait for all",
      inputHandles: "none",
      inputs: flowInputs(context.incomingStepIds),
      outputHandles: "none",
      outputs: context.outgoingStepIds.length
        ? context.outgoingStepIds.map((id) => ({ id, label: id }))
        : [{ id: "completion", label: "completion" }],
    }),
  },
} satisfies Record<StepType, NodeTypeDefinition>;

const emptyPresentation = {
  detail: "",
  inputHandles: "none",
  inputs: [],
  outputHandles: "none",
  outputs: [],
} as const;

export function createNodePresentation(
  step: WorkflowStep,
  workflow: WorkflowDefinition,
): WorkflowNodePresentation {
  const definition: NodeTypeDefinition = workflowNodeRegistry[step._type];
  const incomingStepIds = workflow.transitions
    .filter((transition) => transition.to === step.id)
    .map((transition) => transition.from.stepId);
  const outgoingStepIds = workflow.transitions
    .filter((transition) => transition.from.stepId === step.id)
    .map((transition) => transition.to);

  const referencedOutputs = new Set<string>();
  for (const candidate of workflow.steps) {
    if (candidate._type !== "task") continue;
    for (const expression of Object.values(candidate.inputs)) {
      if (expression._type !== "TaskOutput" || expression.stepId !== step.id) continue;
      referencedOutputs.add(expression.path.join(".") || "result");
    }
  }

  return {
    accent: definition.accent,
    icon: definition.icon,
    label: definition.label,
    ...definition.present(step, {
      incomingStepIds,
      outgoingStepIds,
      referencedOutputs: [...referencedOutputs],
    }),
  };
}

export function getWorkflowNodeHeight(presentation: WorkflowNodePresentation) {
  const portRows = Math.max(presentation.inputs.length, presentation.outputs.length, 1);
  return 154 + portRows * 20;
}

function flowInputs(stepIds: readonly string[]): WorkflowNodePort[] {
  return (stepIds.length ? stepIds : ["workflow start"]).map((id) => ({ id, label: id }));
}
