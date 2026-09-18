import { AlertCircle, Braces, GitBranch, Menu, RefreshCw, Sparkles } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { WorkflowDefinition } from "@/domain/workflow";
import { WorkflowCanvas } from "@/features/workflows/workflow-canvas";
import { WorkflowInspector } from "@/features/workflows/workflow-inspector";
import { WorkflowSidebar } from "@/features/workflows/workflow-sidebar";
import { useWorkflows } from "@/hooks/use-workflows";
import { groupWorkflows } from "@/lib/workflow-groups";

export function App() {
  const workflows = useWorkflows();
  const groups = groupWorkflows(workflows.data);
  const [selected, setSelected] = useState<WorkflowDefinition>();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  }, [workflows.status, workflows.data]);

  const selectWorkflow = (workflow: WorkflowDefinition) => {
    startTransition(() => {
      setSelected(workflow);
      setSelectedNodeId(null);
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
              <GitBranch size={12} /> Definition library <span>/</span> {selected.name}
            </div>
            <h1>{formatName(selected.name)}</h1>
          </div>
          <div className="workspace-header__meta">
            {selected.latest && (
              <span className="latest-pill">
                <Sparkles size={12} /> Latest
              </span>
            )}
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
                    v{version.version}
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
          </div>
        </header>

        <section className="workflow-toolbar" aria-label="Workflow summary">
          <p>{selected.description ?? "No description provided for this workflow."}</p>
          <div>
            {(selected.tags ?? []).map((tag) => (
              <span className="tag" key={tag}>
                #{tag}
              </span>
            ))}
            <span className="summary-stat">
              <Braces size={13} />
              {selected.steps.length} steps
            </span>
          </div>
        </section>

        <div className="workspace-body">
          <WorkflowCanvas workflow={selected} onSelectNode={setSelectedNodeId} />
          <WorkflowInspector
            step={selectedStep}
            workflow={selected}
            onCloseStep={() => setSelectedNodeId(null)}
          />
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <div className="brand-mark brand-mark--large">
        <GitBranch size={23} />
      </div>
      <div className="loading-line">
        <span />
      </div>
      <p>Mapping workflow definitions</p>
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
        <GitBranch size={24} />
      </div>
      <p className="eyebrow">Definition library</p>
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
