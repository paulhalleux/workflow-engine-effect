import { Schema } from "effect";

import { WorkflowInstance, WorkflowStepInstance, WorkflowTaskAttempt } from "../models";

export const WorkflowExecutionDetails = Schema.Struct({
  instance: WorkflowInstance,
  steps: Schema.Array(WorkflowStepInstance),
  attempts: Schema.Array(WorkflowTaskAttempt),
}).annotate({ identifier: "WorkflowExecutionDetails" });

export type WorkflowExecutionDetails = typeof WorkflowExecutionDetails.Type;

export const WorkflowExecutionPage = Schema.Struct({
  items: Schema.Array(WorkflowInstance),
  nextCursor: Schema.optional(Schema.String),
}).annotate({ identifier: "WorkflowExecutionPage" });

export type WorkflowExecutionPage = typeof WorkflowExecutionPage.Type;
