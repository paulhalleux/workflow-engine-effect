import {
  Api,
  WorkflowDefinitionNotFoundProblem,
  WorkflowExecutionNotFoundProblem,
  WorkflowExecutionRejectedProblem,
} from "@workflow/api";
import { WorkflowExecutionService } from "@workflow/engine";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

/**
 * HTTP handlers for workflow execution.
 */
export const WorkflowExecutionHandlers = HttpApiBuilder.group(
  Api,
  "workflowExecutions",
  Effect.fn(function* (handlers) {
    const execution = yield* WorkflowExecutionService;
    return handlers.handleAll({
      list: ({ query }) => execution.listWorkflows(query).pipe(Effect.orDie),
      get: ({ params }) =>
        execution.getWorkflow(params.id).pipe(
          Effect.catchTag("WorkflowInstanceNotFound", (error) =>
            Effect.fail(
              WorkflowExecutionNotFoundProblem.make({
                id: error.id,
                detail: `No workflow execution exists with id "${error.id}".`,
              }),
            ),
          ),
          Effect.catchTag("WorkflowRuntimeStorageError", Effect.die),
        ),
      start: ({ payload }) =>
        execution.startWorkflow(payload).pipe(
          Effect.catchTag("WorkflowDefinitionNotFound", (error) =>
            Effect.fail(
              WorkflowDefinitionNotFoundProblem.make({
                name: error.name,
                version: error.version,
                detail: `Workflow definition "${error.name}" could not be found.`,
              }),
            ),
          ),
          Effect.catchTag("WorkflowInputResolutionError", (error) =>
            Effect.fail(
              WorkflowExecutionRejectedProblem.make({
                field: error.parameterName,
                detail: error.message,
              }),
            ),
          ),
          Effect.catchTag("ValueExpressionResolutionError", (error) =>
            Effect.fail(
              WorkflowExecutionRejectedProblem.make({
                field: error.inputName,
                detail: error.message,
              }),
            ),
          ),
          Effect.catchTags({
            WorkflowInstanceCreationError: (error) =>
              Effect.fail(
                WorkflowExecutionRejectedProblem.make({ detail: error.message, field: undefined }),
              ),
            TaskNotFound: (error) =>
              Effect.fail(
                WorkflowExecutionRejectedProblem.make({
                  detail: `Task implementation "${error.id}" is not registered.`,
                  field: undefined,
                }),
              ),
            WorkflowStepNotFoundError: (error) =>
              Effect.fail(
                WorkflowExecutionRejectedProblem.make({
                  detail: `Workflow step "${error.stepId}" could not be resolved.`,
                  field: undefined,
                }),
              ),
            WorkflowDefinitionStorageError: Effect.die,
            WorkflowRuntimeStorageError: Effect.die,
            WorkflowStepInstanceNotFound: Effect.die,
            WorkflowTaskAttemptNotFound: Effect.die,
            WorkflowInstanceNotFound: Effect.die,
          }),
        ),
    });
  }),
);
