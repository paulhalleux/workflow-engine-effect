import { WorkflowDefinitionEntry } from "@workflow/core";
import { CreateWorkflowDefinition, VersionBumpingOptions } from "@workflow/engine";
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

export class WorkflowDefinitionVersionBumpingError extends Schema.TaggedError<WorkflowDefinitionVersionBumpingError>()(
  "WorkflowDefinitionVersionBumpingError",
  {
    message: Schema.String,
    fromVersion: Schema.optional(Schema.String),
    bump: Schema.Literals(["major", "minor", "patch"]),
    cause: Schema.Defect(),
  },
  { httpApiStatus: 400 },
) {}

const CreatedWorkflowDefinition = WorkflowDefinitionEntry.pipe(HttpApiSchema.status(201));

/**
 * HTTP API for managing workflow definitions.
 */
export class WorkflowDefinitionsApi extends HttpApiGroup.make("workflowDefinitions")
  .add(
    HttpApiEndpoint.get("list", "/", { success: Schema.Array(WorkflowDefinitionEntry) }),
    HttpApiEndpoint.get("listByName", "/:name", {
      params: { name: Schema.String },
      success: Schema.Array(WorkflowDefinitionEntry),
      error: WorkflowDefinitionNotFound,
    }),
    HttpApiEndpoint.get("get", "/:name/v/:version", {
      params: { name: Schema.String, version: Schema.String },
      success: WorkflowDefinitionEntry,
      error: WorkflowDefinitionNotFound,
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: CreateWorkflowDefinition,
      success: CreatedWorkflowDefinition,
      error: Schema.Union([WorkflowDefinitionAlreadyExists, WorkflowDefinitionVersionBumpingError]),
    }),
    HttpApiEndpoint.delete("delete", "/:name/v/:version", {
      params: { name: Schema.String, version: Schema.String },
      success: Schema.Void,
      error: WorkflowDefinitionNotFound,
    }),
    HttpApiEndpoint.post("createVersion", "/:name/version", {
      params: { name: Schema.String },
      payload: VersionBumpingOptions,
      success: CreatedWorkflowDefinition,
      error: Schema.Union([
        WorkflowDefinitionNotFound,
        WorkflowDefinitionAlreadyExists,
        WorkflowDefinitionVersionBumpingError,
      ]),
    }),
  )
  .prefix("/workflow-definitions")
  .annotateMerge(
    OpenApi.annotations({
      title: "Workflow Definitions",
      description: "Manage versioned workflow definitions.",
    }),
  ) {}
