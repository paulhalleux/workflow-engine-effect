import { Schema } from "effect";

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

// WorkflowInstance
export const WorkflowInstanceId = Schema.String.pipe(Schema.brand("WorkflowInstanceId"));
export type WorkflowInstanceId = typeof WorkflowInstanceId.Type;

// WorkflowStepInstance
export const WorkflowStepInstanceId = Schema.String.pipe(Schema.brand("WorkflowStepInstanceId"));
export type WorkflowStepInstanceId = typeof WorkflowStepInstanceId.Type;

// TriggerInstance
export const TriggerInstanceId = Schema.String.pipe(Schema.brand("TriggerInstanceId"));
export type TriggerInstanceId = typeof TriggerInstanceId.Type;
