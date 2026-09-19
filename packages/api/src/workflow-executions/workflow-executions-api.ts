import {
  WorkflowExecutionDetails,
  WorkflowExecutionPage,
  WorkflowInstance,
  WorkflowInstanceId,
} from "@workflow/core";
import { StartWorkflow } from "@workflow/engine";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";

import { WorkflowDefinitionNotFoundProblem } from "../workflow-definitions/errors.ts";
import { WorkflowExecutionNotFoundProblem, WorkflowExecutionRejectedProblem } from "./errors.ts";

const StartedWorkflowInstance = WorkflowInstance.pipe(HttpApiSchema.status(201), (schema) =>
  schema.annotate({ identifier: "StartedWorkflowInstance" }),
);

/**
 * HTTP API for starting and inspecting workflow executions.
 */
export class WorkflowExecutionsApi extends HttpApiGroup.make("workflowExecutions")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        name: Schema.optional(Schema.String),
        version: Schema.optional(Schema.String),
        cursor: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString),
      },
      success: WorkflowExecutionPage,
    }),
    HttpApiEndpoint.get("get", "/:id", {
      params: { id: WorkflowInstanceId },
      success: WorkflowExecutionDetails,
      error: WorkflowExecutionNotFoundProblem.schema,
    }),
    HttpApiEndpoint.post("start", "/", {
      payload: StartWorkflow,
      success: StartedWorkflowInstance,
      error: Schema.Union([
        WorkflowDefinitionNotFoundProblem.schema,
        WorkflowExecutionRejectedProblem.schema,
      ]),
    }),
  )
  .prefix("/workflow-executions")
  .annotateMerge(
    OpenApi.annotations({
      title: "Workflow Executions",
      description: "Start and inspect workflow executions.",
    }),
  ) {}
