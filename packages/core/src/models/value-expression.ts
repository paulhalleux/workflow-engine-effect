import { Schema } from "effect";

import { WorkflowStepDefinitionId } from "./ids.ts";

const LiteralExpression = Schema.Struct({
  _type: Schema.Literal("Literal"),
  value: Schema.Unknown,
}).annotate({ identifier: "LiteralExpression" });

const WorkflowInputExpression = Schema.Struct({
  _type: Schema.Literal("WorkflowInput"),
  name: Schema.String,
}).annotate({ identifier: "WorkflowInputExpression" });

const TaskOutputExpression = Schema.Struct({
  _type: Schema.Literal("TaskOutput"),
  stepId: WorkflowStepDefinitionId,
  path: Schema.Array(Schema.String),
}).annotate({ identifier: "TaskOutputExpression" });

/**
 * A value expression represents a value that can be computed at runtime.
 *
 * It can be one of the following:
 * - A literal value (e.g., `{ _type: "Literal", value: 42 }`)
 * - A reference to a workflow input (e.g., `{ _type: "WorkflowInput", name: "myInput" }`)
 * - A reference to a task output (e.g., `{ _type: "TaskOutput", stepId: "myTask", path: ["myOutput"] }`)
 */
export const ValueExpression = Schema.Union([
  LiteralExpression,
  WorkflowInputExpression,
  TaskOutputExpression,
]).annotate({ identifier: "ValueExpression" });

export type ValueExpression = typeof ValueExpression.Type;
