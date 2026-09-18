import { Schema } from "effect";

import { WorkflowDefinition } from "../models";

export const WorkflowDefinitionEntry = WorkflowDefinition.pipe(
  Schema.fieldsAssign({ latest: Schema.Boolean }),
);

export type WorkflowDefinitionEntry = typeof WorkflowDefinitionEntry.Type;
