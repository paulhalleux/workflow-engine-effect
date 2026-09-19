import {
  TaskStepDefinition,
  WorkflowInstance,
  WorkflowInstanceId,
  WorkflowInstanceStatusEnum,
  WorkflowStepInstance,
  WorkflowStepInstanceId,
  WorkflowStepInstanceStatusEnum,
  WorkflowTaskAttempt,
  WorkflowTaskAttemptId,
} from "@workflow/core";
import { Context, Crypto, DateTime, Effect, Layer } from "effect";

import {
  WorkflowDefinitionNotFound,
  WorkflowDefinitionService,
  WorkflowDefinitionStorageError,
} from "../workflow-definitions";
import { StartWorkflow } from "./commands/start-workflow.ts";
import {
  WorkflowInputResolutionError,
  WorkflowInstanceCreationError,
  WorkflowRuntimeStorageError,
} from "./errors.ts";
import { resolveTaskInput, resolveWorkflowInput } from "./input-resolver.ts";
import { WorkflowRuntimeRepository } from "./workflow-runtime-repository.ts";

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
    ) => Effect.Effect<
      void,
      | WorkflowDefinitionNotFound
      | WorkflowDefinitionStorageError
      | WorkflowInputResolutionError
      | WorkflowInstanceCreationError
      | WorkflowRuntimeStorageError,
      DateTime.DateTime | Crypto.Crypto
    >;
  }
>()("@workflow/engine/WorkflowExecutionService") {
  static readonly layer = Layer.effect(
    WorkflowExecutionService,
    Effect.gen(function* () {
      const workflowDefService = yield* WorkflowDefinitionService;
      const runtimeRepository = yield* WorkflowRuntimeRepository;

      /**
       * Activates a task step by creating a workflow step instance and a task attempt.
       *
       * @param workflow - The workflow instance.
       * @param step - The task step definition to activate.
       * @returns An effect that completes with the created task attempt.
       */
      const activateTaskStep = (workflow: WorkflowInstance, step: TaskStepDefinition) =>
        Effect.gen(function* () {
          const existingSteps = yield* runtimeRepository.listStepInstances(workflow.id);
          const input = yield* resolveTaskInput(step, { workflow, steps: existingSteps });

          const now = yield* DateTime.now;
          const crypto = yield* Crypto.Crypto;

          const stepInstance: WorkflowStepInstance = {
            id: WorkflowStepInstanceId.make(yield* crypto.randomUUIDv7),
            workflowInstanceId: workflow.id,
            stepId: step.id,
            status: WorkflowStepInstanceStatusEnum.Pending,
            input,
            createdAt: now,
          };

          const attempt: WorkflowTaskAttempt = {
            id: WorkflowTaskAttemptId.make(yield* crypto.randomUUIDv7),
            workflowStepInstanceId: stepInstance.id,
            number: 1,
            status: "Pending",
            createdAt: now,
            scheduledAt: now,
          };

          yield* runtimeRepository.createStepInstance(stepInstance);
          yield* runtimeRepository.createTaskAttempt(attempt);

          return attempt;
        });

      const makeWorkflowInstanceId = Effect.gen(function* () {
        const crypto = yield* Crypto.Crypto;
        return WorkflowInstanceId.make(
          yield* crypto.randomUUIDv7.pipe(
            Effect.catchTag("PlatformError", (error) =>
              Effect.fail(
                new WorkflowInstanceCreationError({
                  message: "Failed to generate workflow instance ID",
                  cause: error,
                }),
              ),
            ),
          ),
        );
      });

      return WorkflowExecutionService.of({
        startWorkflow: (command) =>
          Effect.gen(function* () {
            const definition = yield* workflowDefService.get(command.name, command.version);
            const input = yield* resolveWorkflowInput(definition.inputs, command.input);
            const now = yield* DateTime.now;

            const workflow: WorkflowInstance = {
              id: yield* makeWorkflowInstanceId,
              workflowDefinitionName: definition.name,
              workflowDefinitionVersion: definition.version,
              trigger: command.trigger,
              input,
              status: WorkflowInstanceStatusEnum.Running,
              createdAt: now,
              startedAt: now,
            };

            yield* runtimeRepository.createInstance(workflow);
            // advanceWorkflow

            return Effect.succeed(undefined);
          }),
      });
    }),
  );
}
