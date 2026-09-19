import { WorkflowExecutionFailure } from "@workflow/core";
import { Effect } from "effect";

export interface Task {
  readonly execute: (
    input: Readonly<Record<string, unknown>>,
  ) => Effect.Effect<Readonly<Record<string, unknown>>, WorkflowExecutionFailure>;
}
