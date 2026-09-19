import { Schema } from "effect";

import { WorkflowStepInstanceId, WorkflowTaskAttemptId } from "./ids.ts";
import { WorkflowExecutionFailure } from "./workflow-execution-failure.ts";

export const WorkflowTaskAttemptStatus = Schema.Literals([
  "Pending",
  "Running",
  "Succeeded",
  "Failed",
  "Cancelled",
]).annotate({ identifier: "WorkflowTaskAttemptStatus" });

export const WorkflowTaskAttempt = Schema.Struct({
  id: WorkflowTaskAttemptId,
  workflowStepInstanceId: WorkflowStepInstanceId,
  number: Schema.Int,
  status: WorkflowTaskAttemptStatus,
  startedAt: Schema.optional(Schema.DateTimeUtc),
  completedAt: Schema.optional(Schema.DateTimeUtc),
  failure: Schema.optional(WorkflowExecutionFailure),
}).annotate({ identifier: "WorkflowTaskAttempt" });
