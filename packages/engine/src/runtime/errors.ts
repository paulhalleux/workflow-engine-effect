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

export class WorkflowStepInstanceNotFound extends Schema.TaggedError<WorkflowStepInstanceNotFound>()(
  "WorkflowStepInstanceNotFound",
  { id: Schema.String },
) {}

export class ValueExpressionResolutionError extends Schema.TaggedError<ValueExpressionResolutionError>()(
  "ValueExpressionResolutionError",
  { message: Schema.String, inputName: Schema.String },
) {}

export class WorkflowInputResolutionError extends Schema.TaggedError<WorkflowInputResolutionError>()(
  "WorkflowInputResolutionError",
  { message: Schema.String, parameterName: Schema.String },
) {}

export class TaskNotFound extends Schema.TaggedError<TaskNotFound>()("TaskNotFound", {
  id: Schema.String,
}) {}

export class WorkflowInstanceCreationError extends Schema.TaggedError<WorkflowInstanceCreationError>()(
  "WorkflowInstanceCreationError",
  { message: Schema.String, cause: Schema.Defect() },
) {}
