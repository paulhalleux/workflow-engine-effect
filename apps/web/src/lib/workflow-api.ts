import createClient from "openapi-fetch";

import type { paths } from "@/api/schema";

const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "",
});

export class WorkflowApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "WorkflowApiError";
  }
}

export async function listWorkflowDefinitions(signal?: AbortSignal) {
  try {
    const result = await client.GET("/workflow-definitions", { signal });

    if (!result.response.ok) {
      throw new WorkflowApiError(
        `The workflow API returned ${result.response.status}.`,
        result.response.status,
      );
    }

    return result.data ?? [];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof WorkflowApiError) throw error;
    throw new WorkflowApiError("The workflow API could not be reached.");
  }
}
