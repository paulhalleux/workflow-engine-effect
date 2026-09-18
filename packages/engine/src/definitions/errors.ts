import { Schema } from "effect";

import { BumpType } from "./commands/version-bumping-options.ts";

export class WorkflowDefinitionNotFound extends Schema.TaggedError<WorkflowDefinitionNotFound>()(
  "WorkflowDefinitionNotFound",
  { name: Schema.String, version: Schema.optional(Schema.String) },
) {}

export class WorkflowDefinitionAlreadyExists extends Schema.TaggedError<WorkflowDefinitionAlreadyExists>()(
  "WorkflowDefinitionAlreadyExists",
  { name: Schema.String, version: Schema.String },
) {}

export class WorkflowDefinitionStorageError extends Schema.TaggedError<WorkflowDefinitionStorageError>()(
  "WorkflowDefinitionStorageError",
  { message: Schema.String, cause: Schema.Defect() },
) {}

export class WorkflowDefinitionVersionBumpingError extends Schema.TaggedError<WorkflowDefinitionVersionBumpingError>()(
  "WorkflowDefinitionVersionBumpingError",
  {
    message: Schema.String,
    fromVersion: Schema.optional(Schema.String),
    bump: BumpType,
    cause: Schema.Defect(),
  },
) {}
