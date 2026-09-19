import {
  TaskStepDefinition,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowInstanceId,
  WorkflowInstanceStatusEnum,
  WorkflowStepInstance,
  WorkflowStepInstanceId,
  WorkflowStepInstanceStatusEnum,
  WorkflowTaskAttempt,
  WorkflowTaskAttemptId,
  WorkflowTaskAttemptStatusEnum,
} from "@workflow/core";
import { Context, Crypto, DateTime, Duration, Effect, Layer } from "effect";

import {
  WorkflowDefinitionNotFoundError,
  WorkflowDefinitionService,
  WorkflowDefinitionStorageError,
} from "../workflow-definitions";
import { StartWorkflow } from "./commands/start-workflow.ts";
import {
  TaskNotFoundError,
  ValueExpressionResolutionError,
  WorkflowInputResolutionError,
  WorkflowInstanceCreationError,
  WorkflowInstanceNotFoundError,
  WorkflowRuntimeStorageError,
  WorkflowStepInstanceNotFoundError,
  WorkflowStepNotFoundError,
  WorkflowTaskAttemptNotFoundError,
} from "./errors.ts";
import { resolveTaskInput, resolveWorkflowInput } from "./input-resolver.ts";
import { TaskRegistry } from "./task-registry.ts";
import { WorkflowQueue } from "./workflow-queue.ts";
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
      WorkflowInstance,
      | WorkflowDefinitionNotFoundError
      | WorkflowDefinitionStorageError
      | WorkflowInputResolutionError
      | WorkflowInstanceCreationError
      | WorkflowRuntimeStorageError
      | WorkflowStepInstanceNotFoundError
      | WorkflowTaskAttemptNotFoundError
      | ValueExpressionResolutionError
      | WorkflowStepNotFoundError
      | WorkflowInstanceNotFoundError
      | TaskNotFoundError
    >;

    /**
     * Executes a previously queued workflow instance.
     *
     * @param workflowInstanceId - Pending workflow instance to execute.
     */
    readonly executeWorkflow: (
      workflowInstanceId: WorkflowInstanceId,
    ) => Effect.Effect<
      void,
      | WorkflowDefinitionNotFoundError
      | WorkflowDefinitionStorageError
      | WorkflowInputResolutionError
      | WorkflowInstanceCreationError
      | WorkflowRuntimeStorageError
      | WorkflowStepInstanceNotFoundError
      | WorkflowTaskAttemptNotFoundError
      | ValueExpressionResolutionError
      | WorkflowStepNotFoundError
      | WorkflowInstanceNotFoundError
      | TaskNotFoundError
    >;
  }
>()("@workflow/engine/WorkflowExecutionService") {
  static readonly layer = Layer.effect(
    WorkflowExecutionService,
    Effect.gen(function* () {
      const workflowDefService = yield* WorkflowDefinitionService;
      const runtimeRepository = yield* WorkflowRuntimeRepository;
      const taskRegistry = yield* TaskRegistry;
      const workflowQueue = yield* WorkflowQueue;

      const crypto = yield* Crypto.Crypto;

      const makeWorkflowStepInstanceId = crypto.randomUUIDv7.pipe(
        Effect.orDie,
        Effect.map(WorkflowStepInstanceId.make),
      );

      const makeWorkflowTaskAttemptId = crypto.randomUUIDv7.pipe(
        Effect.orDie,
        Effect.map(WorkflowTaskAttemptId.make),
      );

      const makeWorkflowInstanceId = crypto.randomUUIDv7.pipe(
        Effect.orDie,
        Effect.map(WorkflowInstanceId.make),
      );

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

          const stepInstance: WorkflowStepInstance = {
            id: yield* makeWorkflowStepInstanceId,
            workflowInstanceId: workflow.id,
            stepId: step.id,
            status: WorkflowStepInstanceStatusEnum.Pending,
            input,
            createdAt: now,
          };

          const attempt: WorkflowTaskAttempt = {
            id: yield* makeWorkflowTaskAttemptId,
            workflowStepInstanceId: stepInstance.id,
            number: 1,
            status: WorkflowTaskAttemptStatusEnum.Pending,
            createdAt: now,
            scheduledAt: now,
          };

          yield* runtimeRepository.createStepInstance(stepInstance);
          yield* runtimeRepository.createTaskAttempt(attempt);

          yield* Effect.logInfo("Workflow step activated").pipe(
            Effect.annotateLogs({
              workflowInstanceId: workflow.id,
              workflowStepInstanceId: stepInstance.id,
              stepId: step.id,
              taskId: step.taskId,
            }),
          );

          return attempt;
        });

      /**
       * Executes one persisted task attempt.
       *
       * A task failure is recorded in workflow runtime state rather than
       * escaping as an engine failure. Storage and registry failures remain in
       * the Effect error channel.
       */
      const executeTaskAttempt = (
        attemptId: WorkflowTaskAttemptId,
      ): Effect.Effect<
        void,
        | WorkflowDefinitionNotFoundError
        | WorkflowDefinitionStorageError
        | WorkflowRuntimeStorageError
        | WorkflowInstanceNotFoundError
        | WorkflowStepInstanceNotFoundError
        | WorkflowTaskAttemptNotFoundError
        | TaskNotFoundError
      > =>
        Effect.gen(function* () {
          const attempt = yield* runtimeRepository.getTaskAttempt(attemptId);
          if (attempt.status !== WorkflowTaskAttemptStatusEnum.Pending) {
            return;
          }

          const stepInstance = yield* runtimeRepository.getStepInstance(
            attempt.workflowStepInstanceId,
          );

          const workflow = yield* runtimeRepository.getInstance(stepInstance.workflowInstanceId);
          const definition = yield* workflowDefService.get(
            workflow.workflowDefinitionName,
            workflow.workflowDefinitionVersion,
          );

          const stepDefinition = definition.steps.find((step) => step.id === stepInstance.stepId);
          if (stepDefinition === undefined || stepDefinition._type !== "task") {
            return yield* Effect.die(
              new WorkflowStepNotFoundError({ stepId: stepInstance.stepId }),
            );
          }

          const task = yield* taskRegistry.get(stepDefinition.taskId);
          const startedAt = yield* DateTime.now;

          const runningAttempt: WorkflowTaskAttempt = {
            ...attempt,
            status: WorkflowTaskAttemptStatusEnum.Running,
            startedAt,
          };

          const runningStep: WorkflowStepInstance = {
            ...stepInstance,
            status: WorkflowStepInstanceStatusEnum.Running,
            startedAt: stepInstance.startedAt ?? startedAt,
          };

          yield* runtimeRepository.updateTaskAttempt(runningAttempt);
          yield* runtimeRepository.updateStepInstance(runningStep);

          yield* Effect.logInfo("Task attempt started").pipe(
            Effect.annotateLogs({
              workflowInstanceId: workflow.id,
              workflowStepInstanceId: stepInstance.id,
              workflowTaskAttemptId: attempt.id,
              stepId: stepDefinition.id,
              taskId: stepDefinition.taskId,
              attempt: attempt.number,
            }),
          );

          const result = yield* task.execute(runningStep.input).pipe(
            Effect.map((output) => ({ _tag: "Succeeded" as const, output })),
            Effect.catch((failure) => Effect.succeed({ _tag: "Failed" as const, failure })),
          );

          const completedAt = yield* DateTime.now;

          if (result._tag === "Succeeded") {
            yield* Effect.logInfo("Task attempt succeeded").pipe(
              Effect.annotateLogs({
                workflowInstanceId: workflow.id,
                workflowStepInstanceId: stepInstance.id,
                workflowTaskAttemptId: attempt.id,
                stepId: stepDefinition.id,
                taskId: stepDefinition.taskId,
                attempt: attempt.number,
              }),
            );

            yield* runtimeRepository.updateTaskAttempt({
              ...runningAttempt,
              status: WorkflowTaskAttemptStatusEnum.Succeeded,
              completedAt,
              output: result.output,
            });

            yield* runtimeRepository.updateStepInstance({
              ...runningStep,
              status: WorkflowStepInstanceStatusEnum.Succeeded,
              completedAt,
              output: result.output,
            });

            return;
          }

          yield* Effect.logWarning("Task attempt failed").pipe(
            Effect.annotateLogs({
              workflowInstanceId: workflow.id,
              workflowStepInstanceId: stepInstance.id,
              workflowTaskAttemptId: attempt.id,
              stepId: stepDefinition.id,
              taskId: stepDefinition.taskId,
              attempt: attempt.number,
              failure: result.failure.message,
            }),
          );

          yield* runtimeRepository.updateTaskAttempt({
            ...runningAttempt,
            status: WorkflowTaskAttemptStatusEnum.Failed,
            completedAt,
            failure: result.failure,
          });

          const maxAttempts = stepDefinition.retry?.maxAttempts ?? 1;
          if (attempt.number >= maxAttempts) {
            yield* runtimeRepository.updateStepInstance({
              ...runningStep,
              status: WorkflowStepInstanceStatusEnum.Failed,
              completedAt,
              failure: result.failure,
            });

            yield* runtimeRepository.updateInstance({
              ...workflow,
              status: WorkflowInstanceStatusEnum.Failed,
              completedAt,
              failure: result.failure,
            });

            yield* Effect.logError("Workflow failed").pipe(
              Effect.annotateLogs({
                workflowInstanceId: workflow.id,
                workflowStepInstanceId: stepInstance.id,
                workflowTaskAttemptId: attempt.id,
                stepId: stepDefinition.id,
                taskId: stepDefinition.taskId,
                attempt: attempt.number,
                failure: result.failure.message,
              }),
            );

            return;
          }

          const retry = stepDefinition.retry!;
          const nextAttempt: WorkflowTaskAttempt = {
            id: yield* makeWorkflowTaskAttemptId,
            workflowStepInstanceId: stepInstance.id,
            number: attempt.number + 1,
            status: WorkflowTaskAttemptStatusEnum.Pending,
            createdAt: completedAt,
            scheduledAt: DateTime.addDuration(completedAt, Duration.millis(retry.delayMs)),
          };

          yield* runtimeRepository.updateStepInstance({
            ...runningStep,
            status: WorkflowStepInstanceStatusEnum.WaitingRetry,
          });

          yield* runtimeRepository.createTaskAttempt(nextAttempt);

          yield* Effect.logInfo("Task retry scheduled").pipe(
            Effect.annotateLogs({
              workflowInstanceId: workflow.id,
              workflowStepInstanceId: stepInstance.id,
              stepId: stepDefinition.id,
              attempt: nextAttempt.number,
              delayMs: retry.delayMs,
            }),
          );

          yield* Effect.sleep(Duration.millis(retry.delayMs));

          yield* executeTaskAttempt(nextAttempt.id);
        });

      /**
       * Finds task steps that can be activated from the current persisted
       * workflow state.
       */
      const findRunnableTaskSteps = (
        definition: WorkflowDefinition,
        instances: ReadonlyArray<WorkflowStepInstance>,
      ): ReadonlyArray<TaskStepDefinition> => {
        const instantiated = new Set(instances.map((instance) => instance.stepId));

        return definition.steps.filter((step): step is TaskStepDefinition => {
          if (step._type !== "task") {
            return false;
          }

          if (instantiated.has(step.id)) {
            return false;
          }

          const incoming = definition.transitions.filter((transition) => transition.to === step.id);

          return incoming.every((transition) =>
            instances.some(
              (instance) =>
                instance.stepId === transition.from.stepId &&
                instance.status === WorkflowStepInstanceStatusEnum.Succeeded,
            ),
          );
        });
      };

      /**
       * Advances a workflow using the currently persisted execution state.
       *
       * The first implementation supports task-only acyclic workflows.
       */
      const advanceWorkflow = (
        workflowInstanceId: WorkflowInstanceId,
      ): Effect.Effect<
        void,
        | WorkflowDefinitionNotFoundError
        | WorkflowDefinitionStorageError
        | WorkflowRuntimeStorageError
        | WorkflowInstanceNotFoundError
        | WorkflowStepInstanceNotFoundError
        | WorkflowTaskAttemptNotFoundError
        | ValueExpressionResolutionError
        | TaskNotFoundError
      > =>
        Effect.gen(function* () {
          while (true) {
            const workflow = yield* runtimeRepository.getInstance(workflowInstanceId);

            if (workflow.status !== WorkflowInstanceStatusEnum.Running) {
              return;
            }

            const definition = yield* workflowDefService.get(
              workflow.workflowDefinitionName,
              workflow.workflowDefinitionVersion,
            );

            const unsupportedStep = definition.steps.find((step) => step._type !== "task");

            if (unsupportedStep !== undefined) {
              return yield* Effect.die(
                new Error(`Workflow runtime does not support "${unsupportedStep._type}" steps yet`),
              );
            }

            const instances = yield* runtimeRepository.listStepInstances(workflow.id);

            const completed = definition.steps.every((step) =>
              instances.some(
                (instance) =>
                  instance.stepId === step.id &&
                  instance.status === WorkflowStepInstanceStatusEnum.Succeeded,
              ),
            );

            if (completed) {
              yield* runtimeRepository.updateInstance({
                ...workflow,
                status: WorkflowInstanceStatusEnum.Succeeded,
                completedAt: yield* DateTime.now,
              });

              yield* Effect.logInfo("Workflow succeeded").pipe(
                Effect.annotateLogs({
                  workflowInstanceId: workflow.id,
                  workflowDefinitionName: workflow.workflowDefinitionName,
                  workflowDefinitionVersion: workflow.workflowDefinitionVersion,
                }),
              );

              return;
            }

            const runnable = findRunnableTaskSteps(definition, instances);

            if (runnable.length === 0) {
              return;
            }

            const attempts = yield* Effect.forEach(runnable, (step) =>
              activateTaskStep(workflow, step),
            );

            yield* Effect.forEach(attempts, (attempt) => executeTaskAttempt(attempt.id), {
              concurrency: "unbounded",
              discard: true,
            });
          }
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
              status: WorkflowInstanceStatusEnum.Pending,
              createdAt: now,
            };

            yield* runtimeRepository.createInstance(workflow);
            yield* workflowQueue.enqueue(workflow.id);

            yield* Effect.logInfo("Workflow queued").pipe(
              Effect.annotateLogs({
                workflowInstanceId: workflow.id,
                workflowDefinitionName: workflow.workflowDefinitionName,
                workflowDefinitionVersion: workflow.workflowDefinitionVersion,
              }),
            );

            return workflow;
          }),
        executeWorkflow: (workflowInstanceId) =>
          Effect.gen(function* () {
            const workflow = yield* runtimeRepository.getInstance(workflowInstanceId);

            if (workflow.status !== WorkflowInstanceStatusEnum.Pending) {
              return;
            }

            const startedAt = yield* DateTime.now;

            yield* runtimeRepository.updateInstance({
              ...workflow,
              status: WorkflowInstanceStatusEnum.Running,
              startedAt,
            });

            yield* Effect.logInfo("Workflow started").pipe(
              Effect.annotateLogs({
                workflowInstanceId: workflow.id,
                workflowDefinitionName: workflow.workflowDefinitionName,
                workflowDefinitionVersion: workflow.workflowDefinitionVersion,
              }),
            );

            yield* advanceWorkflow(workflow.id);
          }),
      });
    }),
  );
}
