import { AlertCircle, Braces, Menu, Play, RefreshCw, Workflow as WorkflowIcon } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import type { WorkflowDefinition } from "@/domain/workflow";
import { RunWorkflowDialog } from "@/features/executions/run-workflow-dialog";
import { WorkflowLivePanel } from "@/features/executions/workflow-live-panel";
import { WorkflowCanvas } from "@/features/workflows/workflow-canvas";
import { WorkflowInspector } from "@/features/workflows/workflow-inspector";
import { WorkflowSidebar } from "@/features/workflows/workflow-sidebar";
import {
  useStartWorkflow,
  useWorkflowExecution,
  useWorkflowExecutions,
} from "@/hooks/use-workflow-executions";
import { useWorkflows } from "@/hooks/use-workflows";
import { groupWorkflows } from "@/lib/workflow-groups";

type WorkspaceView = "definition" | "live";

export function App() {
  const workflows = useWorkflows();
  const groups = useMemo(() => groupWorkflows(workflows.data), [workflows.data]);
  const [selected, setSelected] = useState<WorkflowDefinition>();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [view, setView] = useState<WorkspaceView>("definition");
  const [activeExecutionId, setActiveExecutionId] = useState<string>();

  const executions = useWorkflowExecutions(selected?.name ?? "", selected?.version ?? "");
  const activeExecution = useWorkflowExecution(activeExecutionId);
  const startExecution = useStartWorkflow();

  useEffect(() => {
    if (workflows.status !== "success") return;
    setSelected((current) => {
      if (current) {
        return (
          workflows.data.find(
            (workflow) => workflow.name === current.name && workflow.version === current.version,
          ) ?? groups[0]?.latest
        );
      }
      return groups[0]?.latest;
    });
  }, [groups, workflows.data, workflows.status]);

  useEffect(() => {
    if (view !== "live" || activeExecutionId || !executions.data?.items[0]) return;
    setActiveExecutionId(executions.data.items[0].id);
  }, [activeExecutionId, executions.data, view]);

  const selectWorkflow = (workflow: WorkflowDefinition) => {
    startTransition(() => {
      setSelected(workflow);
      setSelectedNodeId(null);
      setActiveExecutionId(undefined);
      setSidebarOpen(false);
    });
  };

  if (workflows.status === "loading" && workflows.data.length === 0) return <LoadingScreen />;
  if (workflows.status === "error") {
    return (
      <ApiError
        message={workflows.error?.message ?? "An unknown connection error occurred."}
        onRetry={workflows.refresh}
      />
    );
  }
  if (!selected) return <EmptyScreen onRefresh={workflows.refresh} />;

  const selectedGroup = groups.find((group) => group.name === selected.name);
  const selectedStep = selected.steps.find((step) => step.id === selectedNodeId);
  const recentExecutions = executions.data?.items ?? [];

  return (
    <div className="app-shell">
      <div
        className={sidebarOpen ? "mobile-overlay is-open" : "mobile-overlay"}
        onClick={() => setSidebarOpen(false)}
      />
      <div className={sidebarOpen ? "sidebar-wrap is-open" : "sidebar-wrap"}>
        <WorkflowSidebar
          groups={groups}
          selected={selected}
          onClose={() => setSidebarOpen(false)}
          onSelect={selectWorkflow}
        />
      </div>

      <main className="workspace">
        <header className="workspace-header">
          <Button
            className="mobile-menu"
            size="icon"
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
            <span className="sr-only">Open workflows</span>
          </Button>
          <div className="workspace-header__title">
            <div className="workspace-header__eyebrow">
              <WorkflowIcon size={12} /> Workflows <span>/</span> {selected.name}
            </div>
            <h1>{formatName(selected.name)}</h1>
          </div>

          <Tabs
            className="workspace-tabs"
            value={view}
            onValueChange={(value) => setView(value as WorkspaceView)}
          >
            <TabsList className="workspace-tabs__list">
              <TabsTrigger className="workspace-tabs__trigger" value="definition">
                Definition
              </TabsTrigger>
              <TabsTrigger className="workspace-tabs__trigger" value="live">
                Runs
                {recentExecutions.length > 0 && <span>{recentExecutions.length}</span>}
              </TabsTrigger>
              <TabsIndicator className="workspace-tabs__indicator" />
            </TabsList>
          </Tabs>

          <div className="workspace-header__actions">
            <label className="version-select">
              <span className="sr-only">Workflow version</span>
              <select
                value={selected.version}
                onChange={(event) => {
                  const version = selectedGroup?.versions.find(
                    (item) => item.version === event.target.value,
                  );
                  if (version) selectWorkflow(version);
                }}
              >
                {selectedGroup?.versions.map((version) => (
                  <option key={version.version} value={version.version}>
                    {version.version}
                  </option>
                ))}
              </select>
            </label>
            <Tooltip content="Refresh definitions">
              <Button size="icon" variant="outline" onClick={workflows.refresh}>
                <RefreshCw className={workflows.isFetching ? "is-spinning" : ""} size={15} />
                <span className="sr-only">Refresh definitions</span>
              </Button>
            </Tooltip>
            <Button onClick={() => setRunDialogOpen(true)}>
              <Play size={14} /> Run workflow
            </Button>
          </div>
        </header>

        <section className="workflow-toolbar" aria-label="Workflow summary">
          <p>{selected.description ?? "No description provided for this workflow."}</p>
          <div>
            {selected.latest && <Badge variant="success">Latest</Badge>}
            {(selected.tags ?? []).map((tag) => (
              <Badge variant="muted" key={tag}>
                {tag}
              </Badge>
            ))}
            <span className="summary-stat">
              <Braces size={13} />
              {selected.steps.length} steps
            </span>
          </div>
        </section>

        <div className="workspace-body">
          <WorkflowCanvas
            execution={view === "live" ? activeExecution.data : undefined}
            workflow={selected}
            onSelectNode={setSelectedNodeId}
          />
          {view === "live" ? (
            <WorkflowLivePanel
              execution={activeExecution.data}
              executions={recentExecutions}
              isFetching={activeExecution.isFetching || executions.isFetching}
              selectedId={activeExecutionId}
              onSelect={setActiveExecutionId}
            />
          ) : (
            <WorkflowInspector
              step={selectedStep}
              workflow={selected}
              onCloseStep={() => setSelectedNodeId(null)}
            />
          )}
        </div>
      </main>

      <RunWorkflowDialog
        error={startExecution.error}
        isPending={startExecution.isPending}
        open={runDialogOpen}
        workflow={selected}
        onOpenChange={(open) => {
          setRunDialogOpen(open);
          if (!open) startExecution.reset();
        }}
        onSubmit={(input) =>
          startExecution.mutate(
            { name: selected.name, version: selected.version, input },
            {
              onSuccess: (instance) => {
                setActiveExecutionId(instance.id);
                setView("live");
                setRunDialogOpen(false);
              },
            },
          )
        }
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <div className="brand-mark brand-mark--large">
        <WorkflowIcon size={23} />
      </div>
      <div className="loading-line">
        <span />
      </div>
      <p>Loading workflow workspace</p>
    </main>
  );
}

function ApiError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="fatal-error">
      <div className="fatal-error__icon">
        <AlertCircle size={24} />
      </div>
      <p className="eyebrow">Connection unavailable</p>
      <h1>Couldn’t reach the workflow API.</h1>
      <p>{message} Start `@workflow/server` on port 3000, then try again.</p>
      <Button onClick={onRetry}>
        <RefreshCw size={15} /> Retry connection
      </Button>
    </main>
  );
}

function EmptyScreen({ onRefresh }: { onRefresh: () => void }) {
  return (
    <main className="fatal-error">
      <div className="fatal-error__icon">
        <WorkflowIcon size={24} />
      </div>
      <p className="eyebrow">Workflow catalog</p>
      <h1>No workflows found.</h1>
      <p>Create a workflow definition through the API and refresh the explorer.</p>
      <Button onClick={onRefresh}>
        <RefreshCw size={15} /> Refresh definitions
      </Button>
    </main>
  );
}

function formatName(name: string) {
  return name.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
