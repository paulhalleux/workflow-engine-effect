import type { operations } from "@/api/schema";
import type { StartWorkflowInput } from "@/domain/workflow";
import { ApiError, apiClient, getProblemMessage } from "@/lib/api-client";

export async function listWorkflowExecutions(
  name: string,
  version: string,
  signal?: AbortSignal,
) {
  const result = await apiClient.GET("/workflow-executions", {
    params: { query: { name, version, limit: "30" } },
    signal,
  });

  if (!result.data) {
    throw new ApiError(
      getProblemMessage(result.error, "Could not load workflow executions."),
      result.response.status,
      result.error,
    );
  }
  return result.data;
}

export async function getWorkflowExecution(id: string, signal?: AbortSignal) {
  const result = await apiClient.GET("/workflow-executions/{id}", {
    params: { path: { id } },
    signal,
  });

  if (!result.data) {
    throw new ApiError(
      getProblemMessage(result.error, "Could not load the workflow execution."),
      result.response.status,
      result.error,
    );
  }
  return result.data;
}

export async function startWorkflow(input: StartWorkflowInput) {
  type GeneratedInput =
    operations["workflowExecutions.start"]["requestBody"]["content"]["application/json"];
  const result = await apiClient.POST("/workflow-executions", {
    // Effect's open JSON object is emitted without `additionalProperties`, so
    // openapi-typescript narrows values to `never`. Runtime validation still
    // accepts the JSON-safe `StartWorkflowInput` modeled above.
    body: input as unknown as GeneratedInput,
  });

  if (!result.data) {
    throw new ApiError(
      getProblemMessage(result.error, "Could not start the workflow."),
      result.response.status,
      result.error,
    );
  }
  return result.data;
}
