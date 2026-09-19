import { Schema } from "effect";

import { makeProblem } from "../problem-details.ts";

export const WorkflowExecutionNotFoundProblem = makeProblem(
  "WorkflowExecutionNotFoundProblem",
  {
    status: 404,
    type: "urn:workflow-engine:problem:workflow-execution-not-found",
    title: "Workflow execution not found",
    code: "WORKFLOW_EXECUTION_NOT_FOUND",
  },
  { id: Schema.String },
);

export const WorkflowExecutionRejectedProblem = makeProblem(
  "WorkflowExecutionRejectedProblem",
  {
    status: 400,
    type: "urn:workflow-engine:problem:workflow-execution-rejected",
    title: "Workflow execution rejected",
    code: "WORKFLOW_EXECUTION_REJECTED",
  },
  { field: Schema.optional(Schema.String) },
);
