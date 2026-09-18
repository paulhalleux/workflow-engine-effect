import { WorkflowDefinitionEntry } from "@workflow/core";
import { CreateWorkflowDefinition, VersionBumpingOptions } from "@workflow/engine";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";

import {
  WorkflowDefinitionAlreadyExistsProblem,
  WorkflowDefinitionNotFoundProblem,
  WorkflowDefinitionVersionBumpingErrorProblem,
} from "./errors.ts";

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
      error: WorkflowDefinitionNotFoundProblem.schema,
    }),
    HttpApiEndpoint.get("get", "/:name/v/:version", {
      params: { name: Schema.String, version: Schema.String },
      success: WorkflowDefinitionEntry,
      error: WorkflowDefinitionNotFoundProblem.schema,
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: CreateWorkflowDefinition,
      success: CreatedWorkflowDefinition,
      error: Schema.Union([
        WorkflowDefinitionAlreadyExistsProblem.schema,
        WorkflowDefinitionVersionBumpingErrorProblem.schema,
      ]),
    }),
    HttpApiEndpoint.delete("delete", "/:name/v/:version", {
      params: { name: Schema.String, version: Schema.String },
      success: Schema.Void,
      error: WorkflowDefinitionNotFoundProblem.schema,
    }),
    HttpApiEndpoint.post("createVersion", "/:name/version", {
      params: { name: Schema.String },
      payload: VersionBumpingOptions,
      success: CreatedWorkflowDefinition,
      error: Schema.Union([
        WorkflowDefinitionNotFoundProblem.schema,
        WorkflowDefinitionAlreadyExistsProblem.schema,
        WorkflowDefinitionVersionBumpingErrorProblem.schema,
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
