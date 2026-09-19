import { JsonRecord, WorkflowExecutionFailure } from "@workflow/core";
import { Effect } from "effect";

export interface Task {
  readonly execute: (input: JsonRecord) => Effect.Effect<JsonRecord, WorkflowExecutionFailure>;
}
