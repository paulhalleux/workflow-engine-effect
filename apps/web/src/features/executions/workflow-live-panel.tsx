import { Activity, Clock3, History, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WorkflowExecutionDetails, WorkflowInstance } from "@/domain/workflow";
import { cn } from "@/lib/cn";

import { ExecutionStatusBadge } from "./execution-status-badge";

interface WorkflowLivePanelProps {
  executions: readonly WorkflowInstance[];
  execution?: WorkflowExecutionDetails;
  isFetching: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function WorkflowLivePanel({
  executions,
  execution,
  isFetching,
  selectedId,
  onSelect,
}: WorkflowLivePanelProps) {
  return (
    <aside className="live-panel" aria-label="Workflow runs">
      <header className="panel-header">
        <div>
          <span>Live execution</span>
          <strong>{execution ? shortId(execution.instance.id) : "No run selected"}</strong>
        </div>
        {isFetching && <RefreshCw className="is-spinning" size={14} />}
      </header>

      <div className="live-panel__content">
        {execution ? <ExecutionSummary execution={execution} /> : <LiveEmptyState />}

        <section className="run-history">
          <h3>
            <History size={14} />
            Recent runs
          </h3>
          <div className="run-history__list">
            {executions.map((instance) => (
              <button
                className={cn(
                  "run-history__item",
                  `run-history__item--${instance.status.toLowerCase()}`,
                  selectedId === instance.id && "is-selected",
                )}
                key={instance.id}
                type="button"
                onClick={() => onSelect(instance.id)}
              >
                <span>
                  <Activity size={13} />
                  {shortId(instance.id)}
                </span>
                <ExecutionStatusBadge status={instance.status} />
                <small>{formatTime(instance.createdAt)}</small>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function ExecutionSummary({ execution }: { execution: WorkflowExecutionDetails }) {
  const succeeded = execution.steps.filter((step) => step.status === "Succeeded").length;
  const total = Math.max(execution.steps.length, 1);
  return (
    <>
      <Card className="execution-card">
        <CardHeader>
          <ExecutionStatusBadge status={execution.instance.status} />
          <span>v{execution.instance.workflowDefinitionVersion}</span>
        </CardHeader>
        <CardContent>
          <div className="execution-progress">
            <div>
              <span>Progress</span>
              <strong>
                {succeeded}/{execution.steps.length} steps
              </strong>
            </div>
            <progress max={total} value={succeeded} />
          </div>
          <dl className="execution-meta">
            <div>
              <dt>Started</dt>
              <dd>{formatTime(execution.instance.startedAt ?? execution.instance.createdAt)}</dd>
            </div>
            <div>
              <dt>Attempts</dt>
              <dd>{execution.attempts.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section className="run-steps">
        <h3>
          <Clock3 size={14} />
          Step activity
        </h3>
        {execution.steps.map((step) => (
          <div className="run-step" key={step.id}>
            <span className={cn("run-step__dot", `is-${step.status.toLowerCase()}`)} />
            <div>
              <strong>{step.stepId}</strong>
              <small>{step.status}</small>
            </div>
            <time>{formatTime(step.startedAt ?? step.createdAt)}</time>
          </div>
        ))}
        {execution.steps.length === 0 && (
          <p className="panel-empty-copy">Waiting for the first step…</p>
        )}
      </section>
    </>
  );
}

function LiveEmptyState() {
  return (
    <div className="live-empty">
      <Clock3 size={20} />
      <strong>No run selected</strong>
      <p>Start a workflow or select a recent run to inspect progress.</p>
    </div>
  );
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
