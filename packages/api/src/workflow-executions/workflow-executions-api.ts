import { WorkflowInstance } from "@workflow/core";
import { StartWorkflow } from "@workflow/engine";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";

const StartedWorkflowInstance = WorkflowInstance.pipe(HttpApiSchema.status(201), (schema) =>
  schema.annotate({ identifier: "StartedWorkflowInstance" }),
);

/**
 * HTTP API for starting and inspecting workflow executions.
 */
export class WorkflowExecutionsApi extends HttpApiGroup.make("workflowExecutions")
  .add(
    HttpApiEndpoint.post("start", "/", {
      payload: StartWorkflow,
      success: StartedWorkflowInstance,
    }),
  )
  .prefix("/workflow-executions")
  .annotateMerge(
    OpenApi.annotations({
      title: "Workflow Executions",
      description: "Start and inspect workflow executions.",
    }),
  ) {}
