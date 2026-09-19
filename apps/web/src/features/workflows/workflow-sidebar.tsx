import { Boxes, ChevronRight, ListTree, Search, Workflow, X } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import type { WorkflowDefinition, WorkflowGroup } from "@/domain/workflow";
import { cn } from "@/lib/cn";

interface WorkflowSidebarProps {
  groups: readonly WorkflowGroup[];
  selected?: WorkflowDefinition;
  onSelect: (workflow: WorkflowDefinition) => void;
  onClose?: () => void;
}

export function WorkflowSidebar({ groups, selected, onSelect, onClose }: WorkflowSidebarProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filteredGroups = deferredQuery
    ? groups.filter(
        (group) =>
          group.name.toLowerCase().includes(deferredQuery) ||
          group.latest.tags?.some((tag) => tag.toLowerCase().includes(deferredQuery)),
      )
    : groups;

  return (
    <aside className="sidebar" aria-label="Workflow browser">
      <div className="sidebar__brand">
        <div className="brand-mark" aria-hidden="true">
          <Workflow size={18} />
        </div>
        <div>
          <strong>Orchestra</strong>
          <span>Workflow explorer</span>
        </div>
        {onClose && (
          <Button className="sidebar__close" variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
            <span className="sr-only">Close workflows</span>
          </Button>
        )}
      </div>

      <div className="sidebar__search">
        <Search size={15} aria-hidden="true" />
        <input
          aria-label="Filter workflows"
          placeholder="Search workflows"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <kbd>⌘ K</kbd>
      </div>

      <div className="sidebar__section-heading">
        <span>Definitions</span>
        <span>{filteredGroups.length}</span>
      </div>

      <nav className="workflow-list" aria-label="Workflow definitions">
        {filteredGroups.map((group) => (
          <WorkflowListItem
            group={group}
            isSelected={selected?.name === group.name}
            key={group.name}
            onSelect={onSelect}
          />
        ))}
        {filteredGroups.length === 0 && (
          <div className="sidebar__empty">
            <Boxes size={18} />
            <span>No matching workflows</span>
          </div>
        )}
      </nav>

      <div className="sidebar__footer">
        <span className="status-dot" />
        API connected
        <span>localhost:3000</span>
      </div>
    </aside>
  );
}

function WorkflowListItem({
  group,
  isSelected,
  onSelect,
}: {
  group: WorkflowGroup;
  isSelected: boolean;
  onSelect: (workflow: WorkflowDefinition) => void;
}) {
  const selectWorkflow = () => onSelect(group.latest);

  return (
    <button
      className={cn("workflow-list__item", isSelected && "is-selected")}
      type="button"
      onClick={selectWorkflow}
    >
      <span className="workflow-list__glyph">
        <ListTree size={15} />
      </span>
      <span className="workflow-list__content">
        <strong>{formatName(group.name)}</strong>
        <small>
          v{group.latest.version} · {group.latest.steps.length} steps
        </small>
      </span>
      <ChevronRight className="workflow-list__chevron" size={15} />
    </button>
  );
}

function formatName(name: string) {
  return name.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
