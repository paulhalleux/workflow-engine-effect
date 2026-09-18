import { Schema } from "effect";

// WorkflowDefinition
export const WorkflowDefinitionId = Schema.String.pipe(Schema.brand("WorkflowDefinitionId"));
export type WorkflowDefinitionId = typeof WorkflowDefinitionId.Type;

// WorkflowStepDefinition
export const WorkflowStepDefinitionId = Schema.String.pipe(
  Schema.brand("WorkflowStepDefinitionId"),
);
export type WorkflowStepDefinitionId = typeof WorkflowStepDefinitionId.Type;

// Task
export const TaskId = Schema.String.pipe(Schema.brand("TaskId"));
export type TaskId = typeof TaskId.Type;

// WorkflowStepOutput
export const WorkflowStepOutputId = Schema.String.pipe(Schema.brand("WorkflowStepOutputId"));
export type WorkflowStepOutputId = typeof WorkflowStepOutputId.Type;

// TriggerDefinition
export const TriggerDefinitionId = Schema.String.pipe(Schema.brand("TriggerDefinitionId"));
export type TriggerDefinitionId = typeof TriggerDefinitionId.Type;
