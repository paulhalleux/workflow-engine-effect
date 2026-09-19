import createClient from "openapi-fetch";

import type { paths } from "@/api/schema";

export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "",
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly problem?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getProblemMessage(problem: unknown, fallback: string) {
  if (
    problem !== null &&
    typeof problem === "object" &&
    "detail" in problem &&
    typeof problem.detail === "string"
  ) {
    return problem.detail;
  }
  return fallback;
}
