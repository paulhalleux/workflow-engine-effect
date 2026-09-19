import { Schema } from "effect";

import { JsonRecord } from "./common.ts";
import { WorkflowInstanceId, WorkflowStepDefinitionId, WorkflowStepInstanceId } from "./ids.ts";
import { WorkflowExecutionFailure } from "./workflow-execution-failure.ts";

export enum WorkflowStepInstanceStatusEnum {
  Pending = "Pending",
  Running = "Running",
  WaitingRetry = "WaitingRetry",
  Succeeded = "Succeeded",
  Failed = "Failed",
  Cancelled = "Cancelled",
}

export const WorkflowStepInstanceStatus = Schema.Enum(WorkflowStepInstanceStatusEnum).annotate({
  identifier: "WorkflowStepInstanceStatus",
});

export const WorkflowStepInstance = Schema.Struct({
  id: WorkflowStepInstanceId,
  workflowInstanceId: WorkflowInstanceId,
  stepId: WorkflowStepDefinitionId,
  status: WorkflowStepInstanceStatus,
  input: JsonRecord,
  output: Schema.optional(JsonRecord),
  createdAt: Schema.DateTimeUtc,
  startedAt: Schema.optional(Schema.DateTimeUtc),
  completedAt: Schema.optional(Schema.DateTimeUtc),
  failure: Schema.optional(WorkflowExecutionFailure),
}).annotate({ identifier: "WorkflowStepInstance" });

export type WorkflowStepInstance = typeof WorkflowStepInstance.Type;
