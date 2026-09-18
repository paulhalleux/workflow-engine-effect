# Workflow Explorer

Vite application for browsing and inspecting workflow definitions exposed by `@workflow/server`.

```bash
# Terminal 1
pnpm --filter @workflow/server start

# Terminal 2
pnpm dev:web
```

Vite proxies `/workflow-definitions` to `http://localhost:3000`. Set `VITE_API_URL` when the API is hosted at another origin.

## API client

The checked-in API contract at `src/api/schema.ts` is generated from the server's OpenAPI document. With the server running:

```bash
pnpm generate:api
```

Application code consumes the generated operations through `openapi-fetch`; do not edit `schema.ts` manually.

## Adding a step type

Step rendering is defined in `src/features/workflows/workflow-node-registry.ts`. The registry is exhaustive against the generated API `StepType` union, so regenerating the client after adding a backend step type produces a TypeScript error until its icon, accent and input/output presentation are registered.

Graph layout and React Flow edge/handle mapping live separately in `workflow-layout.ts`; the shared node component does not need another conditional branch for a new type.

Task parameter handles and dashed blue edges represent data dependencies derived from `TaskOutput` expressions. Solid edges represent control transitions. Dagre considers both when minimizing crossings, while React Flow uses deterministic smooth-step and bezier paths.
