import { WorkflowDefinition } from "@workflow/core";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";

/**
 * Returned when a requested workflow definition version does not exist.
 */
export class WorkflowDefinitionNotFound extends Schema.TaggedError<WorkflowDefinitionNotFound>()(
  "WorkflowDefinitionNotFound",
  { name: Schema.String, version: Schema.optional(Schema.String) },
  { httpApiStatus: 404 },
) {}

/**
 * Returned when attempting to create a workflow definition version that
 * already exists.
 */
export class WorkflowDefinitionAlreadyExists extends Schema.TaggedError<WorkflowDefinitionAlreadyExists>()(
  "WorkflowDefinitionAlreadyExists",
  { name: Schema.String, version: Schema.String },
  { httpApiStatus: 409 },
) {}

const CreatedWorkflowDefinition = WorkflowDefinition.pipe(HttpApiSchema.status(201));

/**
 * HTTP API for managing workflow definitions.
 */
export class WorkflowDefinitionsApi extends HttpApiGroup.make("workflowDefinitions")
  .add(
    HttpApiEndpoint.get("list", "/", { success: Schema.Array(WorkflowDefinition) }),
    HttpApiEndpoint.get("listByName", "/:name", {
      params: { name: Schema.String },
      success: Schema.Array(WorkflowDefinition),
      error: WorkflowDefinitionNotFound,
    }),
    HttpApiEndpoint.get("get", "/:name/v/:version", {
      params: { name: Schema.String, version: Schema.String },
      success: WorkflowDefinition,
      error: WorkflowDefinitionNotFound,
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: WorkflowDefinition,
      success: CreatedWorkflowDefinition,
      error: WorkflowDefinitionAlreadyExists,
    }),
    HttpApiEndpoint.delete("delete", "/:name/v/:version", {
      params: { name: Schema.String, version: Schema.String },
      success: Schema.Void,
      error: WorkflowDefinitionNotFound,
    }),
  )
  .prefix("/workflow-definitions")
  .annotateMerge(
    OpenApi.annotations({
      title: "Workflow Definitions",
      description: "Manage versioned workflow definitions.",
    }),
  ) {}
