import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { StartWorkflowInput } from "@/domain/workflow";
import {
  getWorkflowExecution,
  listWorkflowExecutions,
  startWorkflow,
} from "@/lib/workflow-execution-api";

export const executionKeys = {
  all: ["workflow-executions"] as const,
  list: (name: string, version: string) =>
    [...executionKeys.all, "list", name, version] as const,
  detail: (id: string) => [...executionKeys.all, "detail", id] as const,
};

export function useWorkflowExecutions(name: string, version: string) {
  return useQuery({
    queryKey: executionKeys.list(name, version),
    queryFn: ({ signal }) => listWorkflowExecutions(name, version, signal),
    enabled: name.length > 0 && version.length > 0,
    refetchInterval: 3_000,
  });
}

export function useWorkflowExecution(id?: string) {
  return useQuery({
    queryKey: executionKeys.detail(id ?? ""),
    queryFn: ({ signal }) => getWorkflowExecution(id!, signal),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.instance.status;
      return status === "Pending" || status === "Running" ? 1_000 : false;
    },
  });
}

export function useStartWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartWorkflowInput) => startWorkflow(input),
    onSuccess: (instance) => {
      void queryClient.invalidateQueries({
        queryKey: executionKeys.list(
          instance.workflowDefinitionName,
          instance.workflowDefinitionVersion,
        ),
      });
    },
  });
}
