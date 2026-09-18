import { Schema } from "effect";

export const DataType = Schema.Union([
  Schema.Literal("string"),
  Schema.Literal("number"),
  Schema.Literal("boolean"),
  Schema.Literal("array"),
  Schema.Literal("object"),
]);

export type DataType = typeof DataType.Type;

export const ArrayItemType = Schema.Union([
  Schema.Literal("string"),
  Schema.Literal("number"),
  Schema.Literal("boolean"),
  Schema.Literal("object"),
]);

export type ArrayItemType = typeof ArrayItemType.Type;
