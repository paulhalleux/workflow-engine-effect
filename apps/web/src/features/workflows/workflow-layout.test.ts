import { describe, expect, it } from "vitest";

import type { WorkflowDefinition } from "@/domain/workflow";

import { createWorkflowGraph } from "./workflow-layout";

const workflow: WorkflowDefinition = {
  name: "contract-test",
  version: "1.0.0",
  latest: true,
  inputs: [],
  outputs: [],
  triggers: [],
  steps: [
    {
      id: "source",
      name: "Source",
      _type: "task",
      taskId: "source-task",
      inputs: {
        seed: { _type: "WorkflowInput", name: "seed" },
      },
    },
    {
      id: "route",
      name: "Route",
      _type: "decision",
      mode: "firstMatch",
      branches: [{ output: "accepted", condition: "source.ok" }],
      defaultOutput: "rejected",
    },
    {
      id: "consumer",
      name: "Consumer",
      _type: "task",
      taskId: "consumer-task",
      inputs: {
        payload: { _type: "TaskOutput", stepId: "source", path: ["body", "value"] },
      },
    },
    {
      id: "rejected",
      name: "Rejected",
      _type: "task",
      taskId: "rejected-task",
      inputs: {},
    },
  ],
  transitions: [
    { from: { stepId: "source" }, to: "route" },
    { from: { stepId: "route", output: "accepted" }, to: "consumer" },
    { from: { stepId: "route", output: "rejected" }, to: "rejected" },
  ],
};

describe("createWorkflowGraph", () => {
  it("maps decision routes to independent control handles", () => {
    const { edges, nodes } = createWorkflowGraph(workflow);
    const handles = edges
      .filter((edge) => edge.source === "route")
      .map((edge) => edge.sourceHandle)
      .sort();

    expect(handles).toEqual(["control:accepted", "control:rejected"]);
    expect(nodes.find((node) => node.id === "consumer")!.position.y).toBeLessThan(
      nodes.find((node) => node.id === "rejected")!.position.y,
    );
  });

  it("creates a distinct data edge between parameter handles", () => {
    const { edges, nodes } = createWorkflowGraph(workflow);
    const dataEdge = edges.find((edge) => edge.id.startsWith("data-"));
    const source = nodes.find((node) => node.id === "source");
    const consumer = nodes.find((node) => node.id === "consumer");

    expect(dataEdge).toMatchObject({
      source: "source",
      sourceHandle: "data-out:body.value",
      target: "consumer",
      targetHandle: "data-in:payload",
    });
    expect(source?.data.presentation.outputs.map((port) => port.id)).toContain("body.value");
    expect(consumer?.data.presentation.inputs.map((port) => port.id)).toContain("payload");
  });
});
