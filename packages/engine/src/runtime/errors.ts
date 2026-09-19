import { Schema } from "effect";

export class WorkflowRuntimeStorageError extends Schema.TaggedError<WorkflowRuntimeStorageError>()(
  "WorkflowRuntimeStorageError",
  { message: Schema.String, cause: Schema.Defect() },
) {}

export class WorkflowInstanceNotFound extends Schema.TaggedError<WorkflowInstanceNotFound>()(
  "WorkflowInstanceNotFound",
  { id: Schema.String },
) {}

export class WorkflowTaskAttemptNotFound extends Schema.TaggedError<WorkflowTaskAttemptNotFound>()(
  "WorkflowTaskAttemptNotFound",
  { id: Schema.String },
) {}
