import { Schema } from "effect";

import { TaskId, WorkflowStepDefinitionId } from "./ids.ts";
import { ValueExpression } from "./value-expression.ts";

/**
 * Fields shared by every node in a workflow definition.
 */
export const WorkflowStepDefinitionBase = Schema.Struct({
  id: WorkflowStepDefinitionId,
  name: Schema.String,
  description: Schema.optional(Schema.String),
});

/**
 * Fields shared by workflow control-flow nodes.
 *
 * Control nodes are interpreted directly by the workflow engine and affect
 * graph traversal or synchronization rather than delegating executable work.
 */
export const ControlStepDefinitionBase = WorkflowStepDefinitionBase.pipe(
  Schema.fieldsAssign({ _kind: Schema.Literal("control") }),
);

/**
 * Fields shared by executable workflow tasks.
 *
 * Task nodes represent work executed by a task implementation, whether that
 * implementation is built into the engine or registered externally.
 */
export const TaskStepDefinitionBase = WorkflowStepDefinitionBase.pipe(
  Schema.fieldsAssign({
    _kind: Schema.Literal("task"),
    inputs: Schema.Record(Schema.String, ValueExpression),
  }),
);

/**
 * Fork control node.
 *
 * @remarks
 * Keep this node only if fork eventually carries explicit execution semantics.
 * Simple graph fan-out can otherwise be represented by multiple outgoing
 * transitions without an explicit fork node.
 */
export const ForkStepDefinition = ControlStepDefinitionBase.pipe(
  Schema.fieldsAssign({ _type: Schema.Literal("fork") }),
);
export type ForkStepDefinition = typeof ForkStepDefinition.Type;

/**
 * A branch that can be selected by a decision control node.
 */
export const ConditionId = Schema.String.pipe(Schema.brand("ConditionId"));
export type ConditionId = typeof ConditionId.Type;
export const ConditionDefinition = Schema.Struct({ id: ConditionId, condition: Schema.String });
export type ConditionDefinition = typeof ConditionDefinition.Type;

/**
 * Control node that evaluates conditions and selects an outgoing branch.
 */
export const DecisionStepDefinition = ControlStepDefinitionBase.pipe(
  Schema.fieldsAssign({
    _type: Schema.Literal("decision"),
    conditions: Schema.Array(ConditionDefinition),
    /**
     * If true, the decision node will only evaluate the first condition and
     * take the corresponding branch. If false, it will evaluate all conditions
     * and take all branches whose conditions are met (similarly to a fork node).
     */
    singleCondition: Schema.Boolean,
  }),
);
export type DecisionStepDefinition = typeof DecisionStepDefinition.Type;

/**
 * Synchronization control node.
 */
export const JoinMode = Schema.Union([Schema.Literal("all"), Schema.Literal("any")]);
export type JoinMode = typeof JoinMode.Type;

export const JoinStepDefinition = ControlStepDefinitionBase.pipe(
  Schema.fieldsAssign({ _type: Schema.Literal("join"), mode: Schema.optional(JoinMode) }),
);
export type JoinStepDefinition = typeof JoinStepDefinition.Type;

/**
 * Union of control-flow nodes understood directly by the workflow engine.
 */
export const ControlStepDefinition = Schema.Union([
  ForkStepDefinition,
  DecisionStepDefinition,
  JoinStepDefinition,
]);
export type ControlStepDefinition = typeof ControlStepDefinition.Type;

/**
 * Executable task backed by an agent task implementation.
 *
 * The referenced task may eventually be provided by a built-in implementation,
 * an extension, or a remote agent.
 */
export const AgentTaskStepDefinition = TaskStepDefinitionBase.pipe(
  Schema.fieldsAssign({ _type: Schema.Literal("agent"), taskId: TaskId }),
);
export type AgentTaskStepDefinition = typeof AgentTaskStepDefinition.Type;

/**
 * Executable task that starts another workflow definition.
 */
export const SubWorkflowStepDefinition = TaskStepDefinitionBase.pipe(
  Schema.fieldsAssign({
    _type: Schema.Literal("subWorkflow"),
    workflowDefinitionName: Schema.String,
    /**
     * Optional version of the workflow definition to execute. If not provided,
     * the latest version will be used.
     */
    workflowDefinitionVersion: Schema.optional(Schema.String),
  }),
);
export type SubWorkflowStepDefinition = typeof SubWorkflowStepDefinition.Type;

/**
 * Union of executable workflow tasks.
 *
 * Additional built-in task definitions such as HTTP and Script can be added to
 * this union without affecting the engine-owned control-flow model.
 */
export const TaskStepDefinition = Schema.Union([
  AgentTaskStepDefinition,
  SubWorkflowStepDefinition,
]);
export type TaskStepDefinition = typeof TaskStepDefinition.Type;

/**
 * Any node that can appear in a workflow graph.
 */
export const WorkflowStepDefinition = Schema.Union([ControlStepDefinition, TaskStepDefinition]);
export type WorkflowStepDefinition = typeof WorkflowStepDefinition.Type;
