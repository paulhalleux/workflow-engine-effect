import { CircleCheck, CircleDot, CircleX, Clock3, LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { WorkflowInstance } from "@/domain/workflow";

const statusMeta = {
  Pending: { icon: Clock3, variant: "muted", label: "Queued" },
  Running: { icon: LoaderCircle, variant: "default", label: "Running" },
  Succeeded: { icon: CircleCheck, variant: "success", label: "Succeeded" },
  Failed: { icon: CircleX, variant: "danger", label: "Failed" },
  Cancelled: { icon: CircleDot, variant: "muted", label: "Cancelled" },
} as const;

export function ExecutionStatusBadge({ status }: { status: WorkflowInstance["status"] }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon className={status === "Running" ? "is-spinning" : undefined} size={12} />
      {meta.label}
    </Badge>
  );
}
