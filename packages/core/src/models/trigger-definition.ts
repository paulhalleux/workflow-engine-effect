import { Schema } from "effect";

import { TriggerDefinitionId } from "./ids.ts";

/**
 * Fields shared by every workflow trigger definition.
 *
 * A trigger describes a source capable of creating workflow start requests.
 * Runtime subscription state and trigger health are intentionally not part of
 * the persisted workflow definition.
 */
export const TriggerDefinitionBase = Schema.Struct({
  id: TriggerDefinitionId,
  name: Schema.String,
  description: Schema.optional(Schema.String),
});

/**
 * A trigger that allows a workflow to be started explicitly.
 *
 * Manual triggers do not maintain a background subscription. They are
 * typically activated through an API, CLI, or other explicit invocation.
 */
export const ManualTriggerDefinition = TriggerDefinitionBase.pipe(
  Schema.fieldsAssign({ _type: Schema.Literal("manual") }),
).annotate({ identifier: "ManualTriggerDefinition" });
export type ManualTriggerDefinition = typeof ManualTriggerDefinition.Type;

/**
 * A trigger capable of starting a workflow.
 *
 * The MVP supports only manual triggers. Additional trigger definitions such
 * as schedules, webhooks, Kafka subscriptions, or filesystem events can be
 * added to this union as their runtime implementations are introduced.
 */
export const TriggerDefinition = Schema.Union([ManualTriggerDefinition]).annotate({
  identifier: "TriggerDefinition",
});
export type TriggerDefinition = typeof TriggerDefinition.Type;
