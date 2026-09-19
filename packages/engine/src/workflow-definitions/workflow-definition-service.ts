import { WorkflowDefinition, WorkflowDefinitionEntry } from "@workflow/core";
import { Context, Effect, Layer } from "effect";
import { rcompare, inc } from "semver";

import { CreateWorkflowDefinition } from "./commands/create-workflow-definition.ts";
import { VersionBumpingOptions } from "./commands/version-bumping-options.ts";
import {
  WorkflowDefinitionAlreadyExists,
  WorkflowDefinitionNotFound,
  WorkflowDefinitionStorageError,
  WorkflowDefinitionVersionBumpingError,
} from "./errors.ts";
import { WorkflowDefinitionRepository } from "./workflow-definition-repository.ts";

export class WorkflowDefinitionService extends Context.Service<
  WorkflowDefinitionService,
  {
    /**
     * Persists a new immutable workflow definition version.
     *
     * @param command - Command containing the definition and optional version bumping options.
     * @returns An effect that completes when the definition is persisted.
     * @throws WorkflowDefinitionAlreadyExists When the same ID and version
     * already exist.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly create: (
      command: CreateWorkflowDefinition,
    ) => Effect.Effect<
      WorkflowDefinitionEntry,
      | WorkflowDefinitionAlreadyExists
      | WorkflowDefinitionStorageError
      | WorkflowDefinitionVersionBumpingError
    >;

    /**
     * Creates a new workflow definition version by bumping the version of an
     * existing definition.
     *
     * @param name - Workflow definition name.
     * @param versioning - Version bumping options to derive a new version from
     * an existing one.
     * @returns An effect that completes when the definition is persisted.
     * @throws WorkflowDefinitionAlreadyExists When the same ID and version
     * already exist.
     * @throws WorkflowDefinitionNotFound When the requested version does not
     * exist.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly createVersion: (
      name: string,
      versioning: VersionBumpingOptions,
    ) => Effect.Effect<
      WorkflowDefinitionEntry,
      | WorkflowDefinitionAlreadyExists
      | WorkflowDefinitionNotFound
      | WorkflowDefinitionStorageError
      | WorkflowDefinitionVersionBumpingError
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
      WorkflowDefinitionEntry,
      WorkflowDefinitionNotFound | WorkflowDefinitionStorageError
    >;

    /**
     * Lists all stored workflow definition versions.
     *
     * @returns Every stored definition version.
     * @throws WorkflowDefinitionStorageError When the underlying storage fails.
     */
    readonly list: () => Effect.Effect<
      ReadonlyArray<WorkflowDefinitionEntry>,
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
      ReadonlyArray<WorkflowDefinitionEntry>,
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

      const getLatest = (name: string) =>
        Effect.gen(function* () {
          const definitions = yield* repository.listByName(name);
          const latest = definitions.slice().sort((a, b) => {
            return rcompare(a.version, b.version);
          })[0];

          if (!latest) {
            return yield* Effect.fail(new WorkflowDefinitionNotFound({ name }));
          }

          return latest;
        });

      const applyBumpingOptions = (
        definition: Omit<WorkflowDefinition, "version">,
        versioning: VersionBumpingOptions,
      ) =>
        Effect.gen(function* () {
          const { fromVersion, bump } = versioning;

          const source = yield* repository
            .get(definition.name, fromVersion)
            .pipe(Effect.catchTag("WorkflowDefinitionNotFound", () => Effect.succeed(undefined)));

          const newVersion = inc(source?.version ?? "0.0.0", bump);

          if (newVersion === null) {
            return yield* Effect.fail(
              new WorkflowDefinitionVersionBumpingError({
                message: `Failed to bump version ${source?.version ?? "0.0.0"} with bump type ${bump}`,
                fromVersion,
                bump,
                cause: new Error(`Invalid version bumping options: ${JSON.stringify(versioning)}`),
              }),
            );
          }

          return { ...definition, version: newVersion };
        });

      return WorkflowDefinitionService.of({
        create: (command) =>
          Effect.gen(function* () {
            const newDefinition =
              "versioning" in command
                ? yield* applyBumpingOptions(command.definition, command.versioning)
                : command.definition;

            yield* repository.create(newDefinition);
            const latest = yield* getLatest(newDefinition.name).pipe(
              Effect.catchTag("WorkflowDefinitionNotFound", () => Effect.succeed(newDefinition)),
            );

            return { ...newDefinition, latest: latest.version === newDefinition.version };
          }),
        createVersion: (name, versioning) =>
          Effect.gen(function* () {
            const existing = yield* repository.get(name, versioning.fromVersion);
            const newDefinition = yield* repository.create(
              yield* applyBumpingOptions(existing, versioning),
            );

            const latest = yield* getLatest(name).pipe(
              Effect.catchTag("WorkflowDefinitionNotFound", () => Effect.succeed(newDefinition)),
            );

            return { ...newDefinition, latest: latest.version === newDefinition.version };
          }),
        get: (name, version) =>
          Effect.gen(function* () {
            const latest = yield* getLatest(name);
            if (version === undefined) {
              return { ...latest, latest: true };
            }
            return {
              ...(yield* repository.get(name, version)),
              latest: latest.version === version,
            };
          }),
        list: () =>
          Effect.gen(function* () {
            const definitions = yield* repository.list();

            const latestVersions = new Map<string, string>();
            for (const definition of definitions) {
              const currentLatestVersion = latestVersions.get(definition.name);
              if (!currentLatestVersion || rcompare(definition.version, currentLatestVersion) > 0) {
                latestVersions.set(definition.name, definition.version);
              }
            }

            return definitions.map((definition) => ({
              ...definition,
              latest: definition.version === latestVersions.get(definition.name),
            }));
          }),
        listByName: (name) =>
          Effect.gen(function* () {
            const definitions = yield* repository.listByName(name);

            const latestVersion = definitions
              .map((definition) => definition.version)
              .sort(rcompare)[0];

            return definitions.map((definition) => ({
              ...definition,
              latest: definition.version === latestVersion,
            }));
          }),
        delete: (id, version) => repository.delete(id, version),
      });
    }),
  );
}

/**
 * Default live layer for {@link WorkflowDefinitionService}.
 */
export const WorkflowDefinitionServiceLive = WorkflowDefinitionService.layer;
