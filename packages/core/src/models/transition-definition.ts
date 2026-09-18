import { Schema } from "effect";

import { WorkflowStepDefinitionId } from "./ids.ts";
import { ConditionId } from "./workflow-step-definition.ts";

/**
 * A transition between workflow steps.
 *
 * from: The ID of the step that the transition is coming from.
 * to: The ID of the step that the transition is going to.
 * conditionId: The ID of the condition in the source that must be met for the transition to occur. This is optional, as some transitions may not have any conditions.
 */
export const TransitionDefinition = Schema.Struct({
  from: WorkflowStepDefinitionId,
  to: WorkflowStepDefinitionId,
  conditionId: Schema.optional(ConditionId),
});

export type TransitionDefinition = typeof TransitionDefinition.Type;
