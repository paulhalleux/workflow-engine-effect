import { JsonRecord, WorkflowInstanceTrigger } from "@workflow/core";
import { Schema } from "effect";

export const StartWorkflow = Schema.Struct({
  name: Schema.String,
  version: Schema.String,
  input: JsonRecord,
  trigger: Schema.optional(WorkflowInstanceTrigger),
}).annotate({ identifier: "StartWorkflow" });

export type StartWorkflow = typeof StartWorkflow.Type;
