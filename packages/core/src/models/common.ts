import { Schema } from "effect";

export const DataType = Schema.Union([
  Schema.Literal("string"),
  Schema.Literal("number"),
  Schema.Literal("boolean"),
  Schema.Literal("array"),
  Schema.Literal("object"),
]).annotate({ identifier: "DataType" });

export type DataType = typeof DataType.Type;

export const ArrayItemType = Schema.Union([
  Schema.Literal("string"),
  Schema.Literal("number"),
  Schema.Literal("boolean"),
  Schema.Literal("object"),
]).annotate({ identifier: "ArrayItemType" });

export type ArrayItemType = typeof ArrayItemType.Type;

/** JSON-safe object used at HTTP and persistence boundaries. */
export const JsonRecord = Schema.Record(Schema.String, Schema.Json).annotate({
  identifier: "JsonRecord",
});
export type JsonRecord = typeof JsonRecord.Type;
