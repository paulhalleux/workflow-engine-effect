import { Schema } from "effect";

import { ParameterDefinition } from "./parameter-definition.ts";
import { TransitionDefinition } from "./transition-definition.ts";
import { TriggerDefinition } from "./trigger-definition.ts";
import { WorkflowStepDefinition } from "./workflow-step-definition.ts";

export const WorkflowDefinition = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  version: Schema.String,
  tags: Schema.optional(Schema.Array(Schema.String)),
  inputs: Schema.Array(ParameterDefinition),
  outputs: Schema.Array(ParameterDefinition),
  triggers: Schema.Array(TriggerDefinition),
  steps: Schema.Array(WorkflowStepDefinition),
  transitions: Schema.Array(TransitionDefinition),
});

export type WorkflowDefinition = typeof WorkflowDefinition.Type;
