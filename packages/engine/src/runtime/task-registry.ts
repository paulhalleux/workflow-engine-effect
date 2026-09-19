import { TaskId } from "@workflow/core";
import { Context, Effect, Layer, Ref, Schema } from "effect";

import { Task } from "./task.ts";

export class TaskNotFound extends Schema.TaggedError<TaskNotFound>()("TaskNotFound", {
  taskId: TaskId,
}) {}

export class TaskRegistry extends Context.Service<
  TaskRegistry,
  {
    /**
     * Resolves the task implementation registered for an identifier.
     *
     * @param taskId - Task implementation identifier.
     * @returns The registered task.
     */
    readonly get: (taskId: TaskId) => Effect.Effect<Task, TaskNotFound>;
  }
>()("@workflow/engine/TaskRegistry") {
  static readonly memory = Layer.effect(
    TaskRegistry,
    Effect.gen(function* () {
      const tasks = yield* Ref.make(new Map<TaskId, Task>());

      return TaskRegistry.of({
        get: (taskId) =>
          Ref.get(tasks).pipe(
            Effect.flatMap((current) => {
              const task = current.get(taskId);
              if (!task) {
                return Effect.fail(new TaskNotFound({ taskId }));
              }
              return Effect.succeed(task);
            }),
          ),
      });
    }),
  );
}
