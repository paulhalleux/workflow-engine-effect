import { TaskId } from "@workflow/core";
import { Context, Effect, Layer, Schema } from "effect";

import { TaskNotFound } from "./errors.ts";
import { Task } from "./task.ts";

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
  static readonly make = (tasks: ReadonlyMap<TaskId, Task>) =>
    Layer.succeed(
      TaskRegistry,
      TaskRegistry.of({
        get: (taskId) => {
          const task = tasks.get(taskId);
          return task ? Effect.succeed(task) : Effect.fail(new TaskNotFound({ id: taskId }));
        },
      }),
    );
}
