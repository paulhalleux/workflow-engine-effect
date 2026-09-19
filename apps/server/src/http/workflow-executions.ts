import { Api } from "@workflow/api";
import { WorkflowExecutionService } from "@workflow/engine";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

/**
 * HTTP handlers for workflow execution.
 */
export const WorkflowExecutionHandlers = HttpApiBuilder.group(
  Api,
  "workflowExecutions",
  Effect.fn(function* (handlers) {
    const execution = yield* WorkflowExecutionService;
    return handlers.handleAll({
      start: ({ payload }) => execution.startWorkflow(payload).pipe(Effect.orDie),
    });
  }),
);
