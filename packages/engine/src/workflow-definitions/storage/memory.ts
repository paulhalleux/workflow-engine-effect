import type { WorkflowDefinition } from "@workflow/core";
import { Effect, Layer, Ref } from "effect";

import { WorkflowDefinitionAlreadyExists, WorkflowDefinitionNotFoundError } from "../errors.ts";
import { WorkflowDefinitionRepository } from "../workflow-definition-repository.ts";

const keyOf = (definitionLike: { name: string; version: string | undefined }): string =>
  `${definitionLike.name}\0${definitionLike.version}`;

export const WorkflowDefinitionRepositoryMemory = Layer.effect(
  WorkflowDefinitionRepository,
  Effect.gen(function* () {
    const definitions = yield* Ref.make(new Map<string, WorkflowDefinition>());

    return WorkflowDefinitionRepository.of({
      create: (definition) =>
        Ref.modify(definitions, (current) => {
          const key = keyOf(definition);

          if (current.has(key)) {
            return [false, current] as const;
          }

          const next = new Map(current);
          next.set(key, definition);

          return [true, next] as const;
        }).pipe(
          Effect.flatMap((created) =>
            created
              ? Effect.succeed(definition)
              : Effect.fail(
                  new WorkflowDefinitionAlreadyExists({
                    name: definition.name,
                    version: definition.version,
                  }),
                ),
          ),
        ),

      get: (name, version) =>
        Ref.get(definitions).pipe(
          Effect.flatMap((current) => {
            const definition = current.get(keyOf({ name, version }));
            return definition
              ? Effect.succeed(definition)
              : Effect.fail(new WorkflowDefinitionNotFoundError({ name, version }));
          }),
        ),

      list: () => Ref.get(definitions).pipe(Effect.map((current) => Array.from(current.values()))),

      listByName: (name) =>
        Ref.get(definitions).pipe(
          Effect.flatMap((current) => {
            const definitionsByName = Array.from(current.values()).filter(
              (definition) => definition.name === name,
            );

            return definitionsByName.length > 0
              ? Effect.succeed(definitionsByName)
              : Effect.fail(new WorkflowDefinitionNotFoundError({ name, version: undefined }));
          }),
        ),

      delete: (name, version) =>
        Ref.modify(definitions, (current) => {
          const key = keyOf({ name, version });
          const next = new Map(current);
          const deleted = next.delete(key);
          return [deleted, next] as const;
        }).pipe(
          Effect.flatMap((deleted) =>
            deleted
              ? Effect.succeed(undefined)
              : Effect.fail(new WorkflowDefinitionNotFoundError({ name, version })),
          ),
        ),
    });
  }),
);
