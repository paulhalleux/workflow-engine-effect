import { Schema } from "effect";

import { WorkflowInstanceId, WorkflowStepDefinitionId, WorkflowStepInstanceId } from "./ids.ts";

export enum StepRunStatusEnum {
  Pending = "Pending",
  Running = "Running",
  Completed = "Completed",
  Failed = "Failed",
}

export const StepRunStatus = Schema.Enum(StepRunStatusEnum).annotate({
  identifier: "StepRunStatus",
});

export const WorkflowStepInstance = Schema.Struct({
  id: WorkflowStepInstanceId,
  workflowInstanceId: WorkflowInstanceId,
  stepId: WorkflowStepDefinitionId,
  status: StepRunStatus,
  input: Schema.Record(Schema.String, Schema.Unknown),
  output: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  createdAt: Schema.DateTimeUtc,
  startedAt: Schema.optional(Schema.DateTimeUtc),
  completedAt: Schema.optional(Schema.DateTimeUtc),
  reason: Schema.optional(Schema.String),
}).annotate({ identifier: "WorkflowStepInstance" });

export type WorkflowStepInstance = typeof WorkflowStepInstance.Type;
