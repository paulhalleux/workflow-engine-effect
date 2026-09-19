import { Schema } from "effect";

import { WorkflowInstanceId } from "./ids.ts";
import { WorkflowInstanceTrigger } from "./workflow-instance-trigger.ts";

export enum WorkflowInstanceStatusEnum {
  Pending = "Pending",
  Running = "Running",
  Completed = "Completed",
  Failed = "Failed",
}

export const WorkflowInstanceStatus = Schema.Enum(WorkflowInstanceStatusEnum).annotate({
  identifier: "WorkflowInstanceStatus",
});

export const WorkflowInstance = Schema.Struct({
  id: WorkflowInstanceId,
  workflowDefinitionName: Schema.String,
  workflowDefinitionVersion: Schema.String,
  trigger: Schema.optional(WorkflowInstanceTrigger),
  input: Schema.Record(Schema.String, Schema.Unknown),
  output: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  status: WorkflowInstanceStatus,
  createdAt: Schema.DateTimeUtc,
  startedAt: Schema.optional(Schema.DateTimeUtc),
  completedAt: Schema.optional(Schema.DateTimeUtc),
  reason: Schema.optional(Schema.String),
}).annotate({ identifier: "WorkflowInstance" });

export type WorkflowInstance = typeof WorkflowInstance.Type;
