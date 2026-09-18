import { Schema } from "effect";
import { HttpApiSchema } from "effect/unstable/httpapi";

/**
 * Creates a typed Problem Details definition for an HTTP API error.
 *
 * @param identifier - OpenAPI schema identifier.
 * @param options - Fixed Problem Details metadata.
 * @param fields - Problem-specific extension fields.
 * @returns The problem schema and a typed value factory.
 */
export const makeProblem = <
  const Identifier extends string,
  const Status extends number,
  const Type extends string,
  const Title extends string,
  const Code extends string,
  const Fields extends Schema.Struct.Fields,
>(
  identifier: Identifier,
  options: {
    readonly status: Status;
    readonly type: Type;
    readonly title: Title;
    readonly code: Code;
  },
  fields: Fields,
) => {
  const schema = Schema.Struct({
    type: Schema.Literal(options.type),
    title: Schema.Literal(options.title),
    status: Schema.Literal(options.status),
    detail: Schema.optional(Schema.String),
    code: Schema.Literal(options.code),
    ...fields,
  }).pipe(
    (schema) => schema.annotate({ identifier }),
    HttpApiSchema.asJson({ contentType: "application/problem+json" }),
    HttpApiSchema.status(options.status),
  );

  type FieldsType = Schema.Struct.Type<Fields>;
  type Problem = typeof schema.Type;

  return {
    schema,
    make(fields: FieldsType & { readonly detail?: string }): Problem {
      return {
        type: options.type,
        title: options.title,
        status: options.status,
        code: options.code,
        ...fields,
      } as Problem;
    },
  } as const;
};
