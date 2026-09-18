import { useQuery } from "@tanstack/react-query";

import { listWorkflowDefinitions } from "@/lib/workflow-api";

export const workflowKeys = {
  all: ["workflow-definitions"] as const,
};

export function useWorkflows() {
  const query = useQuery({
    queryKey: workflowKeys.all,
    queryFn: ({ signal }) => listWorkflowDefinitions(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? [],
    error: query.error,
    status: query.status === "pending" ? "loading" : query.status,
    isFetching: query.isFetching,
    refresh: () => query.refetch(),
  };
}
