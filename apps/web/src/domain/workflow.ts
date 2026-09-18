import type { operations } from "@/api/schema";

type WorkflowListResponse =
  operations["workflowDefinitions.list"]["responses"][200]["content"]["application/json"];

export type WorkflowDefinition = WorkflowListResponse[number];
export type WorkflowStep = WorkflowDefinition["steps"][number];
export type StepType = WorkflowStep["_type"];
export type ParameterDefinition = WorkflowDefinition["inputs"][number];
export type TransitionDefinition = WorkflowDefinition["transitions"][number];

export interface WorkflowGroup {
  name: string;
  versions: readonly WorkflowDefinition[];
  latest: WorkflowDefinition;
}
