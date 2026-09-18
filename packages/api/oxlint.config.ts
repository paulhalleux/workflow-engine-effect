import sharedConfig from "@paulhalleux/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [sharedConfig],
  plugins: ["react", "jsx-a11y", "typescript"],
});
