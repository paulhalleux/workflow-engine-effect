import { WorkflowExecutionService, WorkflowQueue } from "@workflow/engine";
import { Effect, Layer } from "effect";

/**
 * Runs the server-side workflow queue consumer for the lifetime of the
 * application.
 */
export const WorkflowWorkerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const queue = yield* WorkflowQueue;
    const execution = yield* WorkflowExecutionService;

    yield* Effect.gen(function* () {
      while (true) {
        const workflowInstanceId = yield* queue.dequeue;

        yield* execution
          .executeWorkflow(workflowInstanceId)
          .pipe(Effect.catchCause((cause) => Effect.logError("Workflow execution crashed", cause)));
      }
    }).pipe(Effect.forkScoped);
  }),
);
