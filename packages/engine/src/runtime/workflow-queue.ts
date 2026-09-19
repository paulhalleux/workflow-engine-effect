import { WorkflowInstanceId } from "@workflow/core";
import { Context, Effect, Layer, Queue } from "effect";

export class WorkflowQueue extends Context.Service<
  WorkflowQueue,
  {
    /**
     * Enqueues a workflow instance for execution.
     *
     * @param instanceId - Workflow instance identifier.
     */
    readonly enqueue: (instanceId: WorkflowInstanceId) => Effect.Effect<void>;

    /**
     * Dequeues a workflow instance for execution.
     *
     * @returns The dequeued workflow instance identifier.
     */
    readonly dequeue: Effect.Effect<WorkflowInstanceId>;
  }
>()("@workflow/engine/WorkflowQueue") {
  static readonly memory = Layer.effect(
    WorkflowQueue,
    Effect.gen(function* () {
      const queue = yield* Queue.unbounded<WorkflowInstanceId>();
      return WorkflowQueue.of({
        enqueue: (instanceId) => {
          return Queue.offer(queue, instanceId);
        },
        dequeue: Queue.take(queue),
      });
    }),
  );
}
