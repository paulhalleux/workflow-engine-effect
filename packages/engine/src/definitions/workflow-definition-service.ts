import { WorkflowDefinition } from "@workflow/core";
import { Context, Effect, Layer } from "effect";

import {
  WorkflowDefinitionAlreadyExists,
  WorkflowDefinitionNotFound,
  WorkflowDefinitionStorageError,
} from "./errors.ts";
import { WorkflowDefinitionRepository } from "./workflow-definition-repository.ts";

export class WorkflowDefinitionService extends Context.Service<
  WorkflowDefinitionService,
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
     * @param version - Exact version to retrieve.
     * @returns The stored workflow definition.
     * @throws WorkflowDefinitionNotFound When the requested version does not
     * exist.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly get: (
      name: string,
      version: string,
    ) => Effect.Effect<
      WorkflowDefinition,
      WorkflowDefinitionNotFound | WorkflowDefinitionStorageError
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
      WorkflowDefinitionStorageError | WorkflowDefinitionNotFound
    >;

    /**
     * Deletes a workflow definition version.
     *
     * @param name - Workflow definition name.
     * @param version - Exact version to delete.
     * @returns An effect that completes when the definition is deleted.
     * @throws WorkflowDefinitionNotFound When the requested version does not
     * exist.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly delete: (
      name: string,
      version: string,
    ) => Effect.Effect<void, WorkflowDefinitionNotFound | WorkflowDefinitionStorageError>;
  }
>()("@workflow/engine/WorkflowDefinitionService") {
  /**
   * Default workflow-definition service implementation.
   *
   * Requires a {@link WorkflowDefinitionRepository} and delegates persistence
   * to it. Workflow-level validation and lifecycle rules belong in this layer
   * as they are introduced.
   */
  static readonly layer = Layer.effect(
    WorkflowDefinitionService,
    Effect.gen(function* () {
      const repository = yield* WorkflowDefinitionRepository;

      return WorkflowDefinitionService.of({
        create: (definition) =>
          Effect.gen(function* () {
            yield* repository.create(definition);
            return definition;
          }),
        get: (id, version) => repository.get(id, version),
        list: () => repository.list(),
        listByName: (name) => repository.listByName(name),
        delete: (id, version) => repository.delete(id, version),
      });
    }),
  );
}

/**
 * Default live layer for {@link WorkflowDefinitionService}.
 */
export const WorkflowDefinitionServiceLive = WorkflowDefinitionService.layer;
