import type { WorkflowDefinition, WorkflowGroup } from "@/domain/workflow";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function groupWorkflows(definitions: readonly WorkflowDefinition[]): WorkflowGroup[] {
  const groups = new Map<string, WorkflowDefinition[]>();

  for (const definition of definitions) {
    const versions = groups.get(definition.name) ?? [];
    versions.push(definition);
    groups.set(definition.name, versions);
  }

  return [...groups.entries()]
    .map(([name, versions]) => {
      versions.sort((left, right) => collator.compare(right.version, left.version));
      return {
        name,
        versions,
        latest: versions.find((version) => version.latest) ?? versions[0]!,
      };
    })
    .sort((left, right) => collator.compare(left.name, right.name));
}
