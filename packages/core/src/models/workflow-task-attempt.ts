import { Schema } from "effect";

import { WorkflowStepInstanceId, WorkflowTaskAttemptId } from "./ids.ts";
import { WorkflowExecutionFailure } from "./workflow-execution-failure.ts";

export enum WorkflowTaskAttemptStatusEnum {
  Pending = "Pending",
  Running = "Running",
  Succeeded = "Succeeded",
  Failed = "Failed",
  Cancelled = "Cancelled",
}

export const WorkflowTaskAttemptStatus = Schema.Enum(WorkflowTaskAttemptStatusEnum).annotate({
  identifier: "WorkflowTaskAttemptStatus",
});

export const WorkflowTaskAttempt = Schema.Struct({
  id: WorkflowTaskAttemptId,
  workflowStepInstanceId: WorkflowStepInstanceId,
  number: Schema.Int,
  status: WorkflowTaskAttemptStatus,
  output: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  createdAt: Schema.DateTimeUtc,
  scheduledAt: Schema.DateTimeUtc,
  startedAt: Schema.optional(Schema.DateTimeUtc),
  completedAt: Schema.optional(Schema.DateTimeUtc),
  failure: Schema.optional(WorkflowExecutionFailure),
}).annotate({ identifier: "WorkflowTaskAttempt" });

export type WorkflowTaskAttempt = typeof WorkflowTaskAttempt.Type;
