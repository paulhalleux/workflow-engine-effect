import {
  WorkflowInstance,
  WorkflowInstanceId,
  WorkflowStepInstance,
  WorkflowStepInstanceId,
  WorkflowTaskAttempt,
  WorkflowTaskAttemptId,
} from "@workflow/core";
import { Effect, Layer, Ref } from "effect";

import {
  WorkflowInstanceNotFound,
  WorkflowStepInstanceNotFound,
  WorkflowTaskAttemptNotFound,
} from "../errors.ts";
import { WorkflowRuntimeRepository } from "../workflow-runtime-repository.ts";

interface RuntimeState {
  readonly instances: Map<WorkflowInstanceId, WorkflowInstance>;
  readonly steps: Map<WorkflowStepInstanceId, WorkflowStepInstance>;
  readonly attempts: Map<WorkflowTaskAttemptId, WorkflowTaskAttempt>;
}

export const WorkflowRuntimeRepositoryMemory = Layer.effect(
  WorkflowRuntimeRepository,
  Effect.gen(function* () {
    const state = yield* Ref.make<RuntimeState>({
      instances: new Map(),
      steps: new Map(),
      attempts: new Map(),
    });

    return WorkflowRuntimeRepository.of({
      createInstance: (instance) =>
        Ref.modify(state, (current) => {
          const next = new Map(current.instances);
          next.set(instance.id, instance);

          return [undefined, { ...current, instances: next }] as const;
        }),

      getInstance: (id) =>
        Ref.get(state).pipe(
          Effect.flatMap((current) => {
            const instance = current.instances.get(id);
            if (!instance) {
              return Effect.fail(new WorkflowInstanceNotFound({ id }));
            }
            return Effect.succeed(instance);
          }),
        ),

      updateInstance: (instance) =>
        Ref.modify(state, (current) => {
          const next = new Map(current.instances);
          next.set(instance.id, instance);

          return [undefined, { ...current, instances: next }] as const;
        }),

      createStepInstance: (instance) =>
        Ref.modify(state, (current) => {
          const next = new Map(current.steps);
          next.set(instance.id, instance);

          return [undefined, { ...current, steps: next }] as const;
        }),

      updateStepInstance: (instance) =>
        Ref.modify(state, (current) => {
          const next = new Map(current.steps);
          next.set(instance.id, instance);

          return [undefined, { ...current, steps: next }] as const;
        }),

      getStepInstance: (id) =>
        Ref.get(state).pipe(
          Effect.flatMap((current) => {
            const instance = current.steps.get(id);
            if (!instance) {
              return Effect.fail(new WorkflowStepInstanceNotFound({ id }));
            }
            return Effect.succeed(instance);
          }),
        ),

      createTaskAttempt: (attempt) =>
        Ref.modify(state, (current) => {
          const next = new Map(current.attempts);
          next.set(attempt.id, attempt);

          return [undefined, { ...current, attempts: next }] as const;
        }),

      updateTaskAttempt: (attempt) =>
        Ref.modify(state, (current) => {
          const next = new Map(current.attempts);
          next.set(attempt.id, attempt);

          return [undefined, { ...current, attempts: next }] as const;
        }),

      listStepInstances: (workflowInstanceId) =>
        Ref.get(state).pipe(
          Effect.map((current) =>
            Array.from(current.steps.values()).filter(
              (step) => step.workflowInstanceId === workflowInstanceId,
            ),
          ),
        ),

      getTaskAttempt: (id) =>
        Ref.get(state).pipe(
          Effect.flatMap((current) => {
            const attempt = current.attempts.get(id);
            if (!attempt) {
              return Effect.fail(new WorkflowTaskAttemptNotFound({ id }));
            }
            return Effect.succeed(attempt);
          }),
        ),
    });
  }),
);
