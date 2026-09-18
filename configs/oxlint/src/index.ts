import { defineConfig } from "oxlint";

const ignorePatterns = [
  "**/dist/**",
  "**/node_modules/**",
  "**/.turbo/**",
  "**/coverage/**",
];

export default defineConfig({
  ignorePatterns,
});
