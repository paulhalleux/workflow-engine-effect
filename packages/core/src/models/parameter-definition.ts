import { Schema } from "effect";

import { ArrayItemType, DataType } from "./common.ts";

export const ParameterDefinition = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  dataType: DataType,
  arrayItemType: Schema.optional(ArrayItemType),
  format: Schema.optional(Schema.String),
  required: Schema.Boolean,
  default: Schema.optional(Schema.Json),
}).annotate({ identifier: "ParameterDefinition" });

export type ParameterDefinition = typeof ParameterDefinition.Type;
