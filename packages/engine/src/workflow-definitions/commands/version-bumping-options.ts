import { Schema } from "effect";

export const BumpType = Schema.Literals(["major", "minor", "patch"]).annotate({
  identifier: "BumpType",
});

export type BumpType = typeof BumpType.Type;

/**
 * Determines how a new workflow definition version is derived.
 */
export const VersionBumpingOptions = Schema.Struct({
  bump: BumpType,
  fromVersion: Schema.optional(Schema.String),
}).annotate({ identifier: "VersionBumpingOptions" });

export type VersionBumpingOptions = typeof VersionBumpingOptions.Type;
