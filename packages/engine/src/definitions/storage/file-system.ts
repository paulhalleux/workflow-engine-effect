import { WorkflowDefinition } from "@workflow/core";
import { Effect, FileSystem, Layer, Path, PlatformError, Schema } from "effect";
import { rcompare, valid } from "semver";

import {
  WorkflowDefinitionAlreadyExists,
  WorkflowDefinitionNotFound,
  WorkflowDefinitionStorageError,
} from "../errors.ts";
import { WorkflowDefinitionRepository } from "../workflow-definition-repository.ts";

const WorkflowDefinitionJson = Schema.fromJsonString(WorkflowDefinition, { space: 2 });
const encodeWorkflowDefinition = Schema.encodeEffect(WorkflowDefinitionJson);
const decodeWorkflowDefinition = Schema.decodeUnknownEffect(WorkflowDefinitionJson);

/**
 * Encodes an arbitrary value into a filesystem-safe path segment.
 *
 * Path separators are encoded by `encodeURIComponent`. The special path
 * segments `.` and `..` are encoded explicitly to prevent path traversal.
 *
 * @param value - Value to encode.
 * @returns The filesystem-safe path segment.
 */
const encodePathSegment = (value: string): string => {
  const encoded = encodeURIComponent(value);

  if (encoded === ".") {
    return "%2E";
  }

  if (encoded === "..") {
    return "%2E%2E";
  }

  return encoded;
};

/**
 * Returns whether a platform error represents a missing filesystem entry.
 *
 * @param error - Platform error to inspect.
 * @returns Whether the error represents a missing entry.
 */
const isNotFound = (error: PlatformError.PlatformError): boolean =>
  error.reason._tag === "NotFound";

/**
 * Returns whether a platform error represents an existing filesystem entry.
 *
 * @param error - Platform error to inspect.
 * @returns Whether the error represents an existing entry.
 */
const isAlreadyExists = (error: PlatformError.PlatformError): boolean =>
  error.reason._tag === "AlreadyExists";

/**
 * Converts an unexpected persistence failure into a storage error.
 *
 * @param cause - Original failure.
 * @returns The normalized storage error.
 */
const toStorageError = (cause: unknown): WorkflowDefinitionStorageError =>
  new WorkflowDefinitionStorageError({
    message: "Workflow definition storage operation failed.",
    cause,
  });

/**
 * Creates a file-backed workflow definition repository.
 *
 * Definitions are stored as:
 *
 * `.workflow/definitions/<name>/<version>.json`
 *
 * @param rootDirectory - Root workflow storage directory.
 * @returns A layer providing the file-backed repository.
 */
export const makeWorkflowDefinitionRepositoryFile = (
  rootDirectory = ".workflow",
): Layer.Layer<
  WorkflowDefinitionRepository,
  WorkflowDefinitionStorageError,
  FileSystem.FileSystem | Path.Path
> =>
  Layer.effect(
    WorkflowDefinitionRepository,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      const definitionsDirectory = path.join(rootDirectory, "definitions");

      yield* fs
        .makeDirectory(definitionsDirectory, { recursive: true })
        .pipe(Effect.mapError(toStorageError));

      /**
       * Returns the directory containing all versions of a workflow.
       *
       * @param name - Workflow definition name.
       * @returns The definition directory.
       */
      const getDefinitionDirectory = (name: string): string =>
        path.join(definitionsDirectory, encodePathSegment(name));

      /**
       * Returns the file path of an exact workflow definition version.
       *
       * @param name - Workflow definition name.
       * @param version - Workflow definition version.
       * @returns The definition file path.
       */
      const getDefinitionPath = (name: string, version: string): string =>
        path.join(getDefinitionDirectory(name), `${encodePathSegment(version)}.json`);

      /**
       * Reads and validates a persisted workflow definition.
       *
       * @param filePath - Definition file path.
       * @returns The decoded workflow definition.
       */
      const readDefinitionFile = (
        filePath: string,
      ): Effect.Effect<WorkflowDefinition, WorkflowDefinitionStorageError> =>
        fs
          .readFileString(filePath)
          .pipe(Effect.flatMap(decodeWorkflowDefinition), Effect.mapError(toStorageError));

      /**
       * Reads a directory and returns an empty array when it does not exist.
       *
       * @param directory - Directory to read.
       * @returns Directory entries.
       */
      const readDirectoryOrEmpty = (
        directory: string,
      ): Effect.Effect<Array<string>, WorkflowDefinitionStorageError> =>
        fs
          .readDirectory(directory)
          .pipe(
            Effect.catch((error) =>
              isNotFound(error) ? Effect.succeed([]) : Effect.fail(toStorageError(error)),
            ),
          );

      /**
       * Lists all versions persisted for a workflow name.
       *
       * @param name - Workflow definition name.
       * @returns All persisted versions.
       */
      const listByName = (
        name: string,
      ): Effect.Effect<Array<WorkflowDefinition>, WorkflowDefinitionStorageError> =>
        Effect.gen(function* () {
          const directory = getDefinitionDirectory(name);

          const entries = yield* readDirectoryOrEmpty(directory);

          const files = entries.filter((entry) => entry.endsWith(".json"));

          const definitions = yield* Effect.forEach(files, (entry) =>
            readDefinitionFile(path.join(directory, entry)),
          );

          return definitions.sort((a, b) => rcompare(a.version, b.version));
        });

      /**
       * Resolves the latest persisted workflow definition using SemVer
       * precedence.
       *
       * @param name - Workflow definition name.
       * @returns The highest persisted SemVer definition.
       */
      const getLatest = (
        name: string,
      ): Effect.Effect<
        WorkflowDefinition,
        WorkflowDefinitionNotFound | WorkflowDefinitionStorageError
      > =>
        Effect.gen(function* () {
          const definitions = yield* listByName(name);

          const invalid = definitions.find((definition) => valid(definition.version) === null);

          if (invalid) {
            return yield* Effect.fail(
              toStorageError(
                new Error(`Invalid workflow version "${invalid.version}" for "${name}".`),
              ),
            );
          }

          const latest = definitions[0];

          if (!latest) {
            return yield* Effect.fail(new WorkflowDefinitionNotFound({ name }));
          }

          return latest;
        });

      return WorkflowDefinitionRepository.of({
        create: (definition) =>
          Effect.gen(function* () {
            if (valid(definition.version) === null) {
              return yield* Effect.fail(
                toStorageError(new Error(`Invalid semantic version "${definition.version}".`)),
              );
            }

            const content = yield* encodeWorkflowDefinition(definition).pipe(
              Effect.mapError(toStorageError),
            );

            const directory = getDefinitionDirectory(definition.name);

            yield* fs
              .makeDirectory(directory, { recursive: true })
              .pipe(Effect.mapError(toStorageError));

            const filePath = getDefinitionPath(definition.name, definition.version);

            yield* fs
              .writeFileString(filePath, `${content}\n`, { flag: "wx" })
              .pipe(
                Effect.mapError((error) =>
                  isAlreadyExists(error)
                    ? new WorkflowDefinitionAlreadyExists({
                        name: definition.name,
                        version: definition.version,
                      })
                    : toStorageError(error),
                ),
              );
          }),

        get: (name, version) => {
          if (version === undefined) {
            return getLatest(name);
          }

          const filePath = getDefinitionPath(name, version);

          return fs.readFileString(filePath).pipe(
            Effect.mapError((error) =>
              isNotFound(error)
                ? new WorkflowDefinitionNotFound({ name, version })
                : toStorageError(error),
            ),
            Effect.flatMap((content) =>
              decodeWorkflowDefinition(content).pipe(Effect.mapError(toStorageError)),
            ),
          );
        },

        list: () =>
          Effect.gen(function* () {
            const names = yield* readDirectoryOrEmpty(definitionsDirectory);

            const definitions = yield* Effect.forEach(names, listByName);

            return definitions.flat().sort((a, b) => {
              const byName = a.name.localeCompare(b.name);

              return byName !== 0 ? byName : rcompare(a.version, b.version);
            });
          }),

        listByName,

        delete: (name, version) => {
          const filePath = getDefinitionPath(name, version);
          return fs
            .remove(filePath)
            .pipe(
              Effect.mapError((error) =>
                isNotFound(error)
                  ? new WorkflowDefinitionNotFound({ name, version })
                  : toStorageError(error),
              ),
            );
        },
      });
    }),
  );

/**
 * File-backed workflow definition repository using `.workflow` as its storage
 * root.
 */
export const WorkflowDefinitionRepositoryFile = makeWorkflowDefinitionRepositoryFile();
