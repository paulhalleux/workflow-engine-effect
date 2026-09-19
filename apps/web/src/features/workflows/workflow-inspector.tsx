import { Braces, Check, CircleDot, Info, KeyRound, Route, Workflow, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkflowDefinition, WorkflowStep } from "@/domain/workflow";

interface WorkflowInspectorProps {
  workflow: WorkflowDefinition;
  step?: WorkflowStep;
  onCloseStep: () => void;
}

export function WorkflowInspector({ workflow, step, onCloseStep }: WorkflowInspectorProps) {
  return (
    <aside className="inspector" aria-label={step ? `${step.name} details` : "Workflow details"}>
      <header className="inspector__header">
        <div>
          <span>{step ? "Step inspector" : "Definition"}</span>
          <strong>{step?.name ?? "Workflow details"}</strong>
        </div>
        {step && (
          <Button size="icon" variant="ghost" onClick={onCloseStep}>
            <X size={16} />
            <span className="sr-only">Close step inspector</span>
          </Button>
        )}
      </header>

      {step ? (
        <StepDetails step={step} workflow={workflow} />
      ) : (
        <WorkflowDetails workflow={workflow} />
      )}
    </aside>
  );
}

function WorkflowDetails({ workflow }: { workflow: WorkflowDefinition }) {
  return (
    <div className="inspector__content">
      <section className="inspector__summary">
        <span className="inspector__summary-icon">
          <Workflow size={17} />
        </span>
        <div>
          <strong>{workflow.name}</strong>
          <p>{workflow.description ?? "No description provided."}</p>
        </div>
      </section>

      <DefinitionList
        items={[
          ["Version", workflow.version],
          ["Steps", String(workflow.steps.length)],
          ["Transitions", String(workflow.transitions.length)],
          ["Triggers", String(workflow.triggers.length)],
        ]}
      />

      <InspectorSection icon={KeyRound} title={`Inputs · ${workflow.inputs.length}`}>
        {workflow.inputs.length ? (
          workflow.inputs.map((input) => (
            <div className="parameter-row" key={input.name}>
              <span>
                <CircleDot size={11} />
                {input.name}
              </span>
              <code>
                {input.dataType}
                {input.required ? " *" : ""}
              </code>
            </div>
          ))
        ) : (
          <p className="inspector__muted">No workflow inputs</p>
        )}
      </InspectorSection>

      <InspectorSection icon={Check} title={`Outputs · ${workflow.outputs.length}`}>
        {workflow.outputs.length ? (
          workflow.outputs.map((output) => (
            <div className="parameter-row" key={output.name}>
              <span>
                <CircleDot size={11} />
                {output.name}
              </span>
              <code>{output.dataType}</code>
            </div>
          ))
        ) : (
          <p className="inspector__muted">No workflow outputs</p>
        )}
      </InspectorSection>
    </div>
  );
}

function StepDetails({ step, workflow }: { step: WorkflowStep; workflow: WorkflowDefinition }) {
  const detailsLabel =
    step._type === "task" ? "Parameters" : step._type === "decision" ? "Routes" : "Connections";

  return (
    <Tabs className="inspector-tabs" defaultValue="overview">
      <TabsList className="inspector-tabs__list">
        <TabsTrigger className="inspector-tabs__tab" value="overview">
          Overview
        </TabsTrigger>
        <TabsTrigger className="inspector-tabs__tab" value="details">
          {detailsLabel}
        </TabsTrigger>
        <TabsIndicator className="inspector-tabs__indicator" />
      </TabsList>

      <TabsContent className="inspector__content inspector-tabs__panel" value="overview">
        <StepOverview step={step} />
      </TabsContent>
      <TabsContent className="inspector__content inspector-tabs__panel" value="details">
        <StepParameters step={step} workflow={workflow} />
      </TabsContent>
    </Tabs>
  );
}

function StepOverview({ step }: { step: WorkflowStep }) {
  return (
    <>
      <div className={`step-type-card step-type-card--${step._type}`}>
        <span>{step._type}</span>
        <strong>{step.id}</strong>
        <p>{step.description ?? "No step description provided."}</p>
      </div>
      {step._type === "task" && (
        <DefinitionList
          items={[
            ["Task handler", step.taskId],
            ["Inputs", String(Object.keys(step.inputs).length)],
          ]}
        />
      )}
      {step._type === "decision" && (
        <DefinitionList
          items={[
            ["Evaluation", step.mode],
            ["Branches", String(step.branches.length)],
          ]}
        />
      )}
      {step._type === "join" && <DefinitionList items={[["Wait strategy", step.mode ?? "all"]]} />}
      {step._type === "fork" && (
        <div className="inspector__notice">
          <Info size={15} />
          Starts every connected outgoing path.
        </div>
      )}
    </>
  );
}

function StepParameters({ step, workflow }: { step: WorkflowStep; workflow: WorkflowDefinition }) {
  if (step._type === "task") {
    const outputs = getReferencedOutputs(workflow, step.id);
    return (
      <>
        <InspectorSection icon={Braces} title={`Inputs · ${Object.keys(step.inputs).length}`}>
          {Object.entries(step.inputs).map(([name, expression]) => (
            <div className="binding binding--parameter" key={name}>
              <div>
                <span>{name}</span>
                <code>{expression._type}</code>
              </div>
              <p>{formatExpression(expression)}</p>
            </div>
          ))}
        </InspectorSection>
        <InspectorSection icon={Check} title={`Outputs · ${Math.max(outputs.length, 1)}`}>
          {(outputs.length ? outputs : [{ path: "completion", consumers: [] }]).map((output) => (
            <div className="binding binding--parameter" key={output.path}>
              <div>
                <span>{output.path}</span>
                <code>output</code>
              </div>
              <p>
                {output.consumers.length
                  ? `Used by ${output.consumers.join(", ")}`
                  : "No data consumers"}
              </p>
            </div>
          ))}
        </InspectorSection>
      </>
    );
  }

  if (step._type === "decision") {
    return (
      <InspectorSection icon={Route} title="Ordered routing rules">
        {step.branches.map((branch, index) => (
          <div className="binding" key={branch.output}>
            <div>
              <span>
                {index + 1}. {branch.output}
              </span>
              <code>condition</code>
            </div>
            <p>{branch.condition}</p>
          </div>
        ))}
        {step.defaultOutput && (
          <div className="binding">
            <div>
              <span>
                {step.branches.length + 1}. {step.defaultOutput}
              </span>
              <code>default</code>
            </div>
          </div>
        )}
      </InspectorSection>
    );
  }

  const incoming = workflow.transitions.filter((transition) => transition.to === step.id);
  const outgoing = workflow.transitions.filter((transition) => transition.from.stepId === step.id);
  return (
    <>
      <InspectorSection icon={Route} title={`Incoming · ${incoming.length}`}>
        {incoming.map((transition) => (
          <ConnectionRow
            key={`${transition.from.stepId}-${transition.to}`}
            value={transition.from.stepId}
          />
        ))}
      </InspectorSection>
      <InspectorSection icon={Route} title={`Outgoing · ${outgoing.length}`}>
        {outgoing.map((transition) => (
          <ConnectionRow key={`${transition.from.stepId}-${transition.to}`} value={transition.to} />
        ))}
      </InspectorSection>
    </>
  );
}

function ConnectionRow({ value }: { value: string }) {
  return (
    <div className="parameter-row">
      <span>
        <CircleDot size={11} />
        {value}
      </span>
      <code>control</code>
    </div>
  );
}

function getReferencedOutputs(workflow: WorkflowDefinition, stepId: string) {
  const outputs = new Map<string, Set<string>>();

  for (const candidate of workflow.steps) {
    if (candidate._type !== "task") continue;
    for (const expression of Object.values(candidate.inputs)) {
      if (expression._type !== "TaskOutput" || expression.stepId !== stepId) continue;
      const path = expression.path.join(".") || "result";
      const consumers = outputs.get(path) ?? new Set<string>();
      consumers.add(`${candidate.name}`);
      outputs.set(path, consumers);
    }
  }

  return [...outputs].map(([path, consumers]) => ({ path, consumers: [...consumers] }));
}

function InspectorSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="inspector-section">
      <h3>
        <Icon size={14} />
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function DefinitionList({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl className="definition-list">
      {items.map(([term, detail]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatExpression(expression: Extract<WorkflowStep, { _type: "task" }>["inputs"][string]) {
  switch (expression._type) {
    case "Literal":
      return typeof expression.value === "string"
        ? expression.value
        : (JSON.stringify(expression.value) ?? "null");
    case "WorkflowInput":
      return `workflow.${expression.name}`;
    case "TaskOutput":
      return `${expression.stepId}.${expression.path.join(".")}`;
  }
}
