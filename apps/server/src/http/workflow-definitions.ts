import {
  Api,
  WorkflowDefinitionAlreadyExistsProblem,
  WorkflowDefinitionNotFoundProblem,
  WorkflowDefinitionVersionBumpingErrorProblem,
} from "@workflow/api";
import { WorkflowDefinitionService } from "@workflow/engine";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

/**
 * HTTP handlers for workflow definition management.
 */
export const WorkflowDefinitionHandlers = HttpApiBuilder.group(
  Api,
  "workflowDefinitions",
  Effect.fn(function* (handlers) {
    const definitions = yield* WorkflowDefinitionService;

    return handlers.handleAll({
      list: () => definitions.list().pipe(Effect.orDie),
      listByName: ({ params }) =>
        definitions.listByName(params.name).pipe(
          Effect.catchTag("WorkflowDefinitionStorageError", Effect.die),
          Effect.catchTag("WorkflowDefinitionNotFound", (error) =>
            Effect.fail(
              WorkflowDefinitionNotFoundProblem.make({ name: error.name, version: error.version }),
            ),
          ),
        ),
      get: ({ params }) =>
        definitions.get(params.name, params.version).pipe(
          Effect.catchTag("WorkflowDefinitionNotFound", (error) =>
            Effect.fail(
              WorkflowDefinitionNotFoundProblem.make({ name: error.name, version: error.version }),
            ),
          ),
          Effect.catchTag("WorkflowDefinitionStorageError", Effect.die),
        ),
      create: ({ payload }) =>
        definitions.create(payload).pipe(
          Effect.catchTag("WorkflowDefinitionAlreadyExists", (error) =>
            Effect.fail(
              WorkflowDefinitionAlreadyExistsProblem.make({
                name: error.name,
                version: error.version,
              }),
            ),
          ),
          Effect.catchTag("WorkflowDefinitionVersionBumpingError", (error) =>
            Effect.fail(
              WorkflowDefinitionVersionBumpingErrorProblem.make({
                message: error.message,
                fromVersion: error.fromVersion,
                bump: error.bump,
                cause: error.cause,
              }),
            ),
          ),
          Effect.catchTag("WorkflowDefinitionStorageError", Effect.die),
        ),
      createVersion: ({ params, payload }) =>
        definitions.createVersion(params.name, payload).pipe(
          Effect.catchTag("WorkflowDefinitionNotFound", (error) =>
            Effect.fail(
              WorkflowDefinitionNotFoundProblem.make({ name: error.name, version: error.version }),
            ),
          ),
          Effect.catchTag("WorkflowDefinitionAlreadyExists", (error) =>
            Effect.fail(
              WorkflowDefinitionAlreadyExistsProblem.make({
                name: error.name,
                version: error.version,
              }),
            ),
          ),
          Effect.catchTag("WorkflowDefinitionVersionBumpingError", (error) =>
            Effect.fail(
              WorkflowDefinitionVersionBumpingErrorProblem.make({
                message: error.message,
                fromVersion: error.fromVersion,
                bump: error.bump,
                cause: error.cause,
              }),
            ),
          ),
          Effect.catchTag("WorkflowDefinitionStorageError", Effect.die),
        ),
      delete: ({ params }) =>
        definitions.delete(params.name, params.version).pipe(
          Effect.catchTag("WorkflowDefinitionNotFound", (error) =>
            Effect.fail(
              WorkflowDefinitionNotFoundProblem.make({ name: error.name, version: error.version }),
            ),
          ),
          Effect.catchTag("WorkflowDefinitionStorageError", Effect.die),
        ),
    });
  }),
);
