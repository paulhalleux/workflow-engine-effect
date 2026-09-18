import { Schema } from "effect";

import { makeProblem } from "../problem-details.ts";

export const WorkflowDefinitionNotFoundProblem = makeProblem(
  "WorkflowDefinitionNotFoundProblem",
  {
    status: 404,
    type: "urn:workflow-engine:problem:workflow-definition-not-found",
    title: "Workflow definition not found",
    code: "WORKFLOW_DEFINITION_NOT_FOUND",
  },
  { name: Schema.String, version: Schema.optional(Schema.String) },
);

export const WorkflowDefinitionAlreadyExistsProblem = makeProblem(
  "WorkflowDefinitionAlreadyExistsProblem",
  {
    status: 409,
    type: "urn:workflow-engine:problem:workflow-definition-already-exists",
    title: "Workflow definition already exists",
    code: "WORKFLOW_DEFINITION_ALREADY_EXISTS",
  },
  { name: Schema.String, version: Schema.String },
);

export const WorkflowDefinitionVersionBumpingErrorProblem = makeProblem(
  "WorkflowDefinitionVersionBumpingErrorProblem",
  {
    status: 400,
    type: "urn:workflow-engine:problem:workflow-definition-version-bumping-error",
    title: "Workflow definition version bumping error",
    code: "WORKFLOW_DEFINITION_VERSION_BUMPING_ERROR",
  },
  {
    message: Schema.String,
    fromVersion: Schema.optional(Schema.String),
    bump: Schema.Literals(["major", "minor", "patch"]),
    cause: Schema.Defect(),
  },
);
