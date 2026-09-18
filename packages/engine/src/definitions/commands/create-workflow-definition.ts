import { WorkflowDefinition } from "@workflow/core";
import { Schema, Struct } from "effect";

import { VersionBumpingOptions } from "./version-bumping-options.ts";

/**
 * Creates a workflow definition with an explicitly supplied version.
 */
export const CreateVersionedWorkflowDefinition = Schema.Struct({ definition: WorkflowDefinition });

/**
 * Creates a workflow definition whose version is derived from an existing
 * version using semantic-version bumping.
 */
export const CreateBumpedWorkflowDefinition = Schema.Struct({
  definition: Schema.Struct(Struct.omit(WorkflowDefinition.fields, ["version"])),
  versioning: VersionBumpingOptions,
});

/**
 * Command accepted when creating a new immutable workflow definition version.
 */
export const CreateWorkflowDefinition = Schema.Union([
  CreateVersionedWorkflowDefinition,
  CreateBumpedWorkflowDefinition,
]);

export type CreateWorkflowDefinition = typeof CreateWorkflowDefinition.Type;
