import { ApiError, apiClient } from "@/lib/api-client";

export async function listWorkflowDefinitions(signal?: AbortSignal) {
  try {
    const result = await apiClient.GET("/workflow-definitions", { signal });

    if (!result.response.ok) {
      throw new ApiError(
        `The workflow API returned ${result.response.status}.`,
        result.response.status,
      );
    }

    return result.data ?? [];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError("The workflow API could not be reached.");
  }
}
