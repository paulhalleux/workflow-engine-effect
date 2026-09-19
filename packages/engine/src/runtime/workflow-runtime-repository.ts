import {
  WorkflowInstance,
  WorkflowInstanceId,
  WorkflowStepInstance,
  WorkflowStepInstanceId,
  WorkflowTaskAttempt,
  WorkflowTaskAttemptId,
} from "@workflow/core";
import { Context, Effect } from "effect";

import {
  WorkflowInstanceNotFound,
  WorkflowRuntimeStorageError,
  WorkflowStepInstanceNotFound,
  WorkflowTaskAttemptNotFound,
} from "./errors.ts";

export class WorkflowRuntimeRepository extends Context.Service<
  WorkflowRuntimeRepository,
  {
    /**
     * Persists a newly created workflow instance.
     *
     * @param instance - Workflow instance to persist.
     */
    readonly createInstance: (
      instance: WorkflowInstance,
    ) => Effect.Effect<void, WorkflowRuntimeStorageError>;

    /**
     * Returns an existing workflow instance.
     *
     * @param id - Workflow instance identifier.
     */
    readonly getInstance: (
      id: WorkflowInstanceId,
    ) => Effect.Effect<WorkflowInstance, WorkflowInstanceNotFound | WorkflowRuntimeStorageError>;

    /**
     * Updates an existing workflow instance.
     *
     * @param instance - Workflow instance to update.
     */
    readonly updateInstance: (
      instance: WorkflowInstance,
    ) => Effect.Effect<void, WorkflowRuntimeStorageError>;

    /**
     * Persists a newly created workflow step instance.
     *
     * @param instance - Workflow step instance to persist.
     */
    readonly createStepInstance: (
      instance: WorkflowStepInstance,
    ) => Effect.Effect<void, WorkflowRuntimeStorageError>;

    /**
     * Updates an existing workflow step instance.
     *
     * @param instance - Workflow step instance to update.
     */
    readonly updateStepInstance: (
      instance: WorkflowStepInstance,
    ) => Effect.Effect<void, WorkflowRuntimeStorageError>;

    /**
     * Returns an existing workflow step instance.
     *
     * @param id - Workflow step instance identifier.
     */
    readonly getStepInstance: (
      id: WorkflowStepInstanceId,
    ) => Effect.Effect<
      WorkflowStepInstance,
      WorkflowRuntimeStorageError | WorkflowStepInstanceNotFound
    >;

    /**
     * Lists all workflow step instances for a given workflow instance.
     *
     * @param workflowInstanceId - Workflow instance identifier.
     */
    readonly listStepInstances: (
      workflowInstanceId: WorkflowInstanceId,
    ) => Effect.Effect<ReadonlyArray<WorkflowStepInstance>, WorkflowRuntimeStorageError>;

    /**
     * Persists a newly created workflow task attempt.
     *
     * @param attempt - Workflow task attempt to persist.
     */
    readonly createTaskAttempt: (
      attempt: WorkflowTaskAttempt,
    ) => Effect.Effect<void, WorkflowRuntimeStorageError>;

    /**
     * Updates an existing workflow task attempt.
     *
     * @param attempt - Workflow task attempt to update.
     */
    readonly updateTaskAttempt: (
      attempt: WorkflowTaskAttempt,
    ) => Effect.Effect<void, WorkflowRuntimeStorageError>;

    /**
     * Returns an existing workflow task attempt.
     *
     * @param id - Workflow task attempt identifier.
     */
    readonly getTaskAttempt: (
      id: WorkflowTaskAttemptId,
    ) => Effect.Effect<
      WorkflowTaskAttempt,
      WorkflowTaskAttemptNotFound | WorkflowRuntimeStorageError
    >;
  }
>()("@workflow/engine/WorkflowRuntimeRepository") {}
