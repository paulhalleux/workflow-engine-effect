import { Schema } from "effect";

import { TriggerDefinitionId } from "./ids.ts";

export const WorkflowInstanceTrigger = Schema.Struct({
  triggerId: TriggerDefinitionId,
  type: Schema.String,
  payload: Schema.Unknown,
});
