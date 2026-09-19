import { type WorkflowDefinition } from "@workflow/core";
import { Context, Effect } from "effect";

import {
  WorkflowDefinitionAlreadyExists,
  WorkflowDefinitionNotFoundError,
  WorkflowDefinitionStorageError,
} from "./errors.ts";

export class WorkflowDefinitionRepository extends Context.Service<
  WorkflowDefinitionRepository,
  {
    /**
     * Persists a new immutable workflow definition version.
     *
     * @param definition - Definition version to persist.
     * @returns An effect that completes when the definition is persisted.
     * @throws WorkflowDefinitionAlreadyExists When the same ID and version
     * already exist.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly create: (
      definition: WorkflowDefinition,
    ) => Effect.Effect<
      WorkflowDefinition,
      WorkflowDefinitionAlreadyExists | WorkflowDefinitionStorageError
    >;

    /**
     * Finds an exact workflow definition version.
     *
     * @param name - Workflow definition name.
     * @param version - Exact version to retrieve or undefined to retrieve the latest version.
     * @returns The stored workflow definition.
     * @throws WorkflowDefinitionNotFoundError When the requested version does not
     * exist.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly get: (
      name: string,
      version: string | undefined,
    ) => Effect.Effect<
      WorkflowDefinition,
      WorkflowDefinitionNotFoundError | WorkflowDefinitionStorageError
    >;

    /**
     * Lists all stored workflow definition versions.
     *
     * @returns Every stored definition version.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly list: () => Effect.Effect<
      ReadonlyArray<WorkflowDefinition>,
      WorkflowDefinitionStorageError
    >;

    /**
     * Lists all stored workflow definition versions for a specific workflow definition name.
     *
     * @param name - Workflow definition name.
     * @returns Every stored definition version for the specified name.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly listByName: (
      name: string,
    ) => Effect.Effect<
      ReadonlyArray<WorkflowDefinition>,
      WorkflowDefinitionStorageError | WorkflowDefinitionNotFoundError
    >;

    /**
     * Deletes a workflow definition version.
     *
     * @param name - Workflow definition name.
     * @param version - Exact version to delete.
     * @returns An effect that completes when the definition is deleted.
     * @throws WorkflowDefinitionNotFoundError When the requested version does not
     * exist.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly delete: (
      name: string,
      version: string,
    ) => Effect.Effect<void, WorkflowDefinitionNotFoundError | WorkflowDefinitionStorageError>;
  }
>()("@workflow/engine/WorkflowDefinitionRepository") {}
