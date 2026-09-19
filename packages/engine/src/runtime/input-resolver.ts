import {
  ParameterDefinition,
  TaskStepDefinition,
  ValueExpression,
  WorkflowInstance,
  WorkflowStepInstance,
  WorkflowStepInstanceStatusEnum,
} from "@workflow/core";
import { Effect } from "effect";

import { ValueExpressionResolutionError, WorkflowInputResolutionError } from "./errors.ts";

export interface ValueExpressionContext {
  readonly workflow: WorkflowInstance;
  readonly steps: ReadonlyArray<WorkflowStepInstance>;
}

/**
 * Resolves a value expression against the immutable workflow input and
 * previously completed step outputs.
 *
 * @param inputName - Name of the input being resolved (used for error reporting).
 * @param expression - Expression to resolve.
 * @param context - Runtime values available to expression evaluation.
 * @returns The resolved value.
 */
export const resolveValueExpression = (
  inputName: string,
  expression: ValueExpression,
  context: ValueExpressionContext,
): Effect.Effect<unknown, ValueExpressionResolutionError> => {
  switch (expression._type) {
    case "Literal":
      return Effect.succeed(expression.value);

    case "WorkflowInput": {
      if (!Object.hasOwn(context.workflow.input, expression.name)) {
        return Effect.fail(
          new ValueExpressionResolutionError({
            inputName,
            message: `Workflow input "${expression.name}" is not available`,
          }),
        );
      }

      return Effect.succeed(context.workflow.input[expression.name]);
    }

    case "TaskOutput": {
      const step = context.steps.find(
        (instance) =>
          instance.stepId === expression.stepId &&
          instance.status === WorkflowStepInstanceStatusEnum.Succeeded,
      );

      if (!step?.output) {
        return Effect.fail(
          new ValueExpressionResolutionError({
            message: `Output for step "${expression.stepId}" is not available because the step does not have an output or has not succeeded`,
            inputName,
          }),
        );
      }

      return resolvePath(inputName, step.output, expression.path);
    }
  }
};

const resolvePath = (
  inputName: string,
  value: unknown,
  path: ReadonlyArray<string>,
): Effect.Effect<unknown, ValueExpressionResolutionError> => {
  let current = value;

  for (const segment of path) {
    if (typeof current !== "object" || current === null || !Object.hasOwn(current, segment)) {
      return Effect.fail(
        new ValueExpressionResolutionError({
          message: `Path "${path.join(".")}" is not available`,
          inputName,
        }),
      );
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return Effect.succeed(current);
};

/**
 * Resolves all declared inputs for a task step.
 *
 * @param step - Task step whose input expressions are evaluated.
 * @param context - Runtime values available to expression evaluation.
 * @returns The immutable task input snapshot.
 */
export const resolveTaskInput = (
  step: TaskStepDefinition,
  context: ValueExpressionContext,
): Effect.Effect<Readonly<Record<string, unknown>>, ValueExpressionResolutionError> => {
  return Effect.forEach(Object.entries(step.inputs), ([name, expression]) => {
    return resolveValueExpression(name, expression, context).pipe(
      Effect.map((value) => [name, value] as const),
    );
  }).pipe(Effect.map(Object.fromEntries));
};

/**
 * Resolves all declared inputs for a workflow.
 *
 * It ensures that all required inputs are provided, applies default values for optional inputs,
 * and constructs an immutable snapshot of the workflow input.
 *
 * @param parameters - Workflow input parameter definitions.
 * @param input - Workflow input values.
 * @returns The immutable workflow input snapshot.
 */
export const resolveWorkflowInput = (
  parameters: ReadonlyArray<ParameterDefinition>,
  input: Readonly<Record<string, unknown>>,
): Effect.Effect<Readonly<Record<string, unknown>>, WorkflowInputResolutionError> => {
  return Effect.forEach(parameters, (parameter) => {
    if (!Object.hasOwn(input, parameter.name)) {
      if (parameter.default !== undefined) {
        return Effect.succeed([parameter.name, parameter.default] as const);
      }

      if (!parameter.required) {
        return Effect.succeed([parameter.name, undefined] as const);
      }

      return Effect.fail(
        new WorkflowInputResolutionError({
          message: `Workflow input "${parameter.name}" is not provided`,
          parameterName: parameter.name,
        }),
      );
    }

    const value = input[parameter.name];
    return Effect.succeed([parameter.name, value] as const);
  }).pipe(Effect.map(Object.fromEntries));
};
