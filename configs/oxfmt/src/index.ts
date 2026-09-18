import { defineConfig } from "oxfmt";

const ignorePatterns = [
  "**/dist/**",
  "**/node_modules/**",
  "**/.turbo/**",
  "**/coverage/**",
];

export default defineConfig({
  arrowParens: "always",
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: "lf",
  ignorePatterns,
  insertFinalNewline: true,
  jsxSingleQuote: false,
  objectWrap: "collapse",
  printWidth: 100,
  proseWrap: "preserve",
  quoteProps: "as-needed",
  semi: true,
  singleAttributePerLine: false,
  singleQuote: false,
  sortImports: {
    ignoreCase: true,
    newlinesBetween: true,
    sortSideEffects: false,
  },
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,
});
