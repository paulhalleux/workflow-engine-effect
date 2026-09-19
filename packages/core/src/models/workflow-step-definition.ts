import { Schema } from "effect";

import { TaskId, WorkflowStepDefinitionId, WorkflowStepOutputId } from "./ids.ts";
import { ValueExpression } from "./value-expression.ts";

/**
 * Fields shared by every step in a workflow definition.
 */
export const WorkflowStepDefinitionBase = Schema.Struct({
  id: WorkflowStepDefinitionId,
  name: Schema.String,
  description: Schema.optional(Schema.String),
});

/**
 * A control-flow step that forks execution into every outgoing transition.
 *
 * The fork does not execute work itself. Once reached, all directly connected
 * successor steps become eligible for execution.
 */
export const ForkStepDefinition = WorkflowStepDefinitionBase.pipe(
  Schema.fieldsAssign({ _type: Schema.Literal("fork") }),
).annotate({ identifier: "ForkStepDefinition" });
export type ForkStepDefinition = typeof ForkStepDefinition.Type;

/**
 * Identifies how a decision selects its outgoing branches.
 *
 * - `firstMatch` selects the first matching branch in declaration order.
 * - `allMatches` selects every matching branch.
 */
export const DecisionMode = Schema.Literals(["firstMatch", "allMatches"]).annotate({
  identifier: "DecisionMode",
});
export type DecisionMode = typeof DecisionMode.Type;

/**
 * A conditional output exposed by a decision step.
 */
export const DecisionBranchDefinition = Schema.Struct({
  output: WorkflowStepOutputId,
  condition: Schema.String,
}).annotate({ identifier: "DecisionBranchDefinition" });
export type DecisionBranchDefinition = typeof DecisionBranchDefinition.Type;

/**
 * A control-flow step that selects one or more outputs by evaluating
 * conditions.
 *
 * Branches are evaluated in declaration order. When no branch matches,
 * `defaultOutput`, when provided, is selected.
 *
 * When `allowMultipleMatches` is true, all matching branches are selected.
 * Otherwise, only the first matching branch is selected.
 */
export const DecisionStepDefinition = WorkflowStepDefinitionBase.pipe(
  Schema.fieldsAssign({
    _type: Schema.Literal("decision"),
    mode: DecisionMode,
    branches: Schema.Array(DecisionBranchDefinition),
    defaultOutput: Schema.optional(WorkflowStepOutputId),
    allowMultipleMatches: Schema.optional(Schema.Boolean),
  }),
).annotate({ identifier: "DecisionStepDefinition" });
export type DecisionStepDefinition = typeof DecisionStepDefinition.Type;

/**
 * Identifies how a join synchronizes its incoming execution branches.
 *
 * - `all` waits for every required incoming branch.
 * - `any` continues as soon as one incoming branch completes.
 */
export const JoinMode = Schema.Literals(["all", "any"]).annotate({ identifier: "JoinMode" });
export type JoinMode = typeof JoinMode.Type;

/**
 * A control-flow step that synchronizes multiple incoming execution branches.
 *
 * The incoming branches themselves are defined by the workflow transitions.
 */
export const JoinStepDefinition = WorkflowStepDefinitionBase.pipe(
  Schema.fieldsAssign({ _type: Schema.Literal("join"), mode: Schema.optional(JoinMode) }),
).annotate({ identifier: "JoinStepDefinition" });
export type JoinStepDefinition = typeof JoinStepDefinition.Type;

/**
 * A control-flow step interpreted directly by the workflow engine.
 *
 * Control steps alter graph traversal or synchronization and do not delegate
 * executable work to the task registry.
 */
export const ControlStepDefinition = Schema.Union([
  ForkStepDefinition,
  DecisionStepDefinition,
  JoinStepDefinition,
]).annotate({ identifier: "ControlStepDefinition" });
export type ControlStepDefinition = typeof ControlStepDefinition.Type;

/**
 * Defines how a task step is retried when it fails.
 */
export const TaskRetryDefinition = Schema.Struct({
  maxAttempts: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  delayMs: Schema.Number.check(Schema.isGreaterThanOrEqualTo(0)),
}).annotate({ identifier: "TaskRetryDefinition" });
export type TaskRetryDefinition = typeof TaskRetryDefinition.Type;

/**
 * An executable workflow step.
 *
 * `taskId` identifies an implementation in the task registry. A task
 * implementation may be built into the engine, provided by an extension, or
 * delegated to a remote agent without changing the workflow definition.
 *
 * Inputs are resolved by the workflow engine before the task is executed.
 */
export const TaskStepDefinition = WorkflowStepDefinitionBase.pipe(
  Schema.fieldsAssign({
    _type: Schema.Literal("task"),
    taskId: TaskId,
    inputs: Schema.Record(Schema.String, ValueExpression),
    retry: Schema.optional(TaskRetryDefinition),
  }),
).annotate({ identifier: "TaskStepDefinition" });
export type TaskStepDefinition = typeof TaskStepDefinition.Type;

/**
 * Any step that can appear in a workflow graph.
 */
export const WorkflowStepDefinition = Schema.Union([
  ControlStepDefinition,
  TaskStepDefinition,
]).annotate({ identifier: "WorkflowStepDefinition" });
export type WorkflowStepDefinition = typeof WorkflowStepDefinition.Type;
