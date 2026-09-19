import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const directory = path.dirname(fileURLToPath(import.meta.url));
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(directory, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/workflow-definitions": apiProxyTarget,
      "/workflow-executions": apiProxyTarget,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          flow: ["@dagrejs/dagre", "@xyflow/react"],
          query: ["@tanstack/react-query", "openapi-fetch"],
          ui: ["@base-ui/react", "lucide-react"],
        },
      },
    },
  },
});
