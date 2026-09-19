import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { WorkflowDefinitionsApi } from "./workflow-definitions";
import { WorkflowExecutionsApi } from "./workflow-executions";

/**
 * Workflow engine HTTP API.
 */
export class Api extends HttpApi.make("workflowEngine")
  .add(WorkflowDefinitionsApi)
  .add(WorkflowExecutionsApi)
  .annotateMerge(OpenApi.annotations({ title: "Workflow Engine API" })) {}
