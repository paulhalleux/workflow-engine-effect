import { Schema } from "effect";

import { WorkflowStepDefinitionId, WorkflowStepOutputId } from "./ids.ts";

/**
 * Identifies a source endpoint in the workflow graph.
 *
 * `output` is omitted for steps with an unconditional/default outgoing path
 * and identifies a specific output for steps that expose multiple routes.
 */
export const WorkflowTransitionSource = Schema.Struct({
  stepId: WorkflowStepDefinitionId,
  output: Schema.optional(WorkflowStepOutputId),
}).annotate({ identifier: "WorkflowTransitionSource" });
export type WorkflowTransitionSource = typeof WorkflowTransitionSource.Type;

/**
 * Connects an output of one workflow step to another workflow step.
 *
 * Transitions describe graph topology only. Conditions and other execution
 * semantics remain owned by the source step definition.
 */
export const TransitionDefinition = Schema.Struct({
  from: WorkflowTransitionSource,
  to: WorkflowStepDefinitionId,
}).annotate({ identifier: "TransitionDefinition" });
export type TransitionDefinition = typeof TransitionDefinition.Type;
