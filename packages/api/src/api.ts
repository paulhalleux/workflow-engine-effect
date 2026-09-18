import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { WorkflowDefinitionsApi } from "./workflow-definitions-api.ts";

/**
 * Workflow engine HTTP API.
 */
export class Api extends HttpApi.make("workflowEngine")
  .add(WorkflowDefinitionsApi)
  .annotateMerge(OpenApi.annotations({ title: "Workflow Engine API" })) {}
