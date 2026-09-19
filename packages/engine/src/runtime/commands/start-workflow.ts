import { WorkflowInstanceTrigger } from "@workflow/core";

export interface StartWorkflow {
  readonly name: string;
  readonly version: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly trigger?: WorkflowInstanceTrigger;
}
