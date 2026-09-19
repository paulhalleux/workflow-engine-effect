import { Schema } from "effect";

export const WorkflowExecutionFailure = Schema.Struct({
  message: Schema.String,
  code: Schema.optional(Schema.String),
  details: Schema.optional(Schema.Unknown),
}).annotate({ identifier: "WorkflowExecutionFailure" });

export type WorkflowExecutionFailure = typeof WorkflowExecutionFailure.Type;
