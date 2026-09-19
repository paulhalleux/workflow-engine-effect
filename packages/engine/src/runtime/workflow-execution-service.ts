import { Context, Effect, Layer } from "effect";

import {
  WorkflowDefinitionNotFound,
  WorkflowDefinitionService,
  WorkflowDefinitionStorageError,
} from "../workflow-definitions";
import { StartWorkflow } from "./commands/start-workflow.ts";

export class WorkflowExecutionService extends Context.Service<
  WorkflowExecutionService,
  {
    /**
     * Starts a workflow execution.
     *
     * @param command - The command containing workflow details.
     */
    readonly startWorkflow: (
      command: StartWorkflow,
    ) => Effect.Effect<void, WorkflowDefinitionNotFound | WorkflowDefinitionStorageError>;
  }
>()("@workflow/engine/WorkflowExecutionService") {
  static readonly layer = Layer.effect(
    WorkflowExecutionService,
    Effect.gen(function* () {
      const workflowDefService = yield* WorkflowDefinitionService;
      return WorkflowExecutionService.of({
        startWorkflow: (command) =>
          Effect.gen(function* () {
            const workflowDef = yield* workflowDefService.get(command.name, command.version);

            return Effect.succeed(undefined);
          }),
      });
    }),
  );
}
