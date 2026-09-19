import { Schema } from "effect";

import { JsonRecord } from "./common.ts";
import { WorkflowInstanceId } from "./ids.ts";
import { WorkflowExecutionFailure } from "./workflow-execution-failure.ts";
import { WorkflowInstanceTrigger } from "./workflow-instance-trigger.ts";

export enum WorkflowInstanceStatusEnum {
  Pending = "Pending",
  Running = "Running",
  Succeeded = "Succeeded",
  Failed = "Failed",
  Cancelled = "Cancelled",
}

export const WorkflowInstanceStatus = Schema.Enum(WorkflowInstanceStatusEnum).annotate({
  identifier: "WorkflowInstanceStatus",
});

export const WorkflowInstance = Schema.Struct({
  id: WorkflowInstanceId,
  workflowDefinitionName: Schema.String,
  workflowDefinitionVersion: Schema.String,
  trigger: Schema.optional(WorkflowInstanceTrigger),
  input: JsonRecord,
  output: Schema.optional(JsonRecord),
  status: WorkflowInstanceStatus,
  createdAt: Schema.DateTimeUtc,
  startedAt: Schema.optional(Schema.DateTimeUtc),
  completedAt: Schema.optional(Schema.DateTimeUtc),
  failure: Schema.optional(WorkflowExecutionFailure),
}).annotate({ identifier: "WorkflowInstance" });

export type WorkflowInstance = typeof WorkflowInstance.Type;
