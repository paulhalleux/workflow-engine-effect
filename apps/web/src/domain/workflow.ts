import type { components, operations } from "@/api/schema";

type WorkflowListResponse =
  operations["workflowDefinitions.list"]["responses"][200]["content"]["application/json"];

export type WorkflowDefinition = WorkflowListResponse[number];
export type WorkflowStep = WorkflowDefinition["steps"][number];
export type StepType = WorkflowStep["_type"];
export type ParameterDefinition = WorkflowDefinition["inputs"][number];
export type TransitionDefinition = WorkflowDefinition["transitions"][number];
export type WorkflowInstance = components["schemas"]["WorkflowInstance"];
export type WorkflowExecutionDetails = components["schemas"]["WorkflowExecutionDetails"];
export type WorkflowStepInstance = components["schemas"]["WorkflowStepInstance"];
export type WorkflowTaskAttempt = components["schemas"]["WorkflowTaskAttempt"];
export type JsonValue =
  | boolean
  | number
  | string
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };
type GeneratedStartWorkflowInput =
  operations["workflowExecutions.start"]["requestBody"]["content"]["application/json"];
export type StartWorkflowInput = Omit<GeneratedStartWorkflowInput, "input"> & {
  input: Record<string, JsonValue>;
};

export interface WorkflowGroup {
  name: string;
  versions: readonly WorkflowDefinition[];
  latest: WorkflowDefinition;
}
