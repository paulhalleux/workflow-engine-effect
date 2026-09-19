import { Schema } from "effect";

export class WorkflowRuntimeStorageError extends Schema.TaggedError<WorkflowRuntimeStorageError>()(
  "WorkflowRuntimeStorageError",
  { message: Schema.String, cause: Schema.Defect() },
) {}

export class WorkflowInstanceNotFoundError extends Schema.TaggedError<WorkflowInstanceNotFoundError>()(
  "WorkflowInstanceNotFound",
  { id: Schema.String },
) {}

export class WorkflowTaskAttemptNotFoundError extends Schema.TaggedError<WorkflowTaskAttemptNotFoundError>()(
  "WorkflowTaskAttemptNotFound",
  { id: Schema.String },
) {}

export class WorkflowStepInstanceNotFoundError extends Schema.TaggedError<WorkflowStepInstanceNotFoundError>()(
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

export class TaskNotFoundError extends Schema.TaggedError<TaskNotFoundError>()("TaskNotFound", {
  id: Schema.String,
}) {}

export class WorkflowInstanceCreationError extends Schema.TaggedError<WorkflowInstanceCreationError>()(
  "WorkflowInstanceCreationError",
  { message: Schema.String, cause: Schema.Defect() },
) {}

export class WorkflowStepNotFoundError extends Schema.TaggedError<WorkflowStepNotFoundError>()(
  "WorkflowStepNotFoundError",
  { stepId: Schema.String },
) {}
