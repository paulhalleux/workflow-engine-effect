import { TaskId } from "@workflow/core";
import { Task, TaskRegistry } from "@workflow/engine";
import { Effect } from "effect";

const echoTask: Task = {
  execute: (input) =>
    Effect.gen(function* () {
      yield* Effect.logInfo("Executing debug.echo").pipe(
        Effect.annotateLogs({ input: JSON.stringify(input) }),
      );

      yield* Effect.sleep("5000 millis");
      return input;
    }),
};

/**
 * Task implementations available to the development server.
 */
export const ServerTaskRegistryLive = TaskRegistry.make(
  new Map([[TaskId.make("debug.echo"), echoTask]]),
);
