import sharedConfig from "@paulhalleux/tsdown-config";
import { defineConfig } from "tsdown";

export default defineConfig({ ...sharedConfig, entry: ["src/index.ts"] });
