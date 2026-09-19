import { Play, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { JsonValue, WorkflowDefinition } from "@/domain/workflow";

interface RunWorkflowDialogProps {
  workflow: WorkflowDefinition;
  open: boolean;
  isPending: boolean;
  error?: Error | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: Record<string, JsonValue>) => void;
}

export function RunWorkflowDialog({
  workflow,
  open,
  isPending,
  error,
  onOpenChange,
  onSubmit,
}: RunWorkflowDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() => getInitialValues(workflow));

  useEffect(() => {
    if (open) setValues(getInitialValues(workflow));
  }, [open, workflow]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(
      Object.fromEntries(
        workflow.inputs.map((parameter) => [
          parameter.name,
          parseParameterValue(parameter.dataType, values[parameter.name] ?? ""),
        ]),
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="run-dialog__header">
          <div>
            <DialogTitle className="run-dialog__title">Run workflow</DialogTitle>
            <DialogDescription className="run-dialog__description">
              Start {workflow.name} at version {workflow.version}.
            </DialogDescription>
          </div>
          <DialogClose render={<Button size="icon" variant="ghost" />}>
            <X size={16} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <form className="run-dialog__form" onSubmit={submit}>
          {workflow.inputs.length === 0 ? (
            <div className="run-dialog__empty">This workflow does not require input.</div>
          ) : (
            workflow.inputs.map((parameter) => (
              <label className="form-field" key={parameter.name}>
                <span className="form-field__label">
                  {parameter.name}
                  {parameter.required && <em>Required</em>}
                </span>
                <Input
                  required={parameter.required}
                  type={parameter.dataType === "number" ? "number" : "text"}
                  value={values[parameter.name] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [parameter.name]: event.target.value }))
                  }
                />
                <small>{parameter.description ?? parameter.dataType}</small>
              </label>
            ))
          )}
          {error && <p className="form-error">{error.message}</p>}
          <div className="run-dialog__footer">
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button disabled={isPending} type="submit">
              <Play size={14} />
              {isPending ? "Starting…" : "Start run"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getInitialValues(workflow: WorkflowDefinition) {
  return Object.fromEntries(
    workflow.inputs.map((parameter) => [
      parameter.name,
      parameter.default === undefined
        ? ""
        : typeof parameter.default === "object"
          ? JSON.stringify(parameter.default)
          : String(parameter.default),
    ]),
  );
}

function parseParameterValue(dataType: string, value: string): JsonValue {
  if (dataType === "number") return Number(value);
  if (dataType === "boolean") return value === "true";
  if (dataType === "array" || dataType === "object") {
    try {
      return JSON.parse(value) as JsonValue;
    } catch {
      return value;
    }
  }
  return value;
}
