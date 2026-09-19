import { createServer } from "node:http";

import { NodeHttpServer, NodeRuntime, NodeServices } from "@effect/platform-node";
import { Api } from "@workflow/api";
import {
  WorkflowDefinitionRepositoryFile,
  WorkflowDefinitionServiceLive,
  WorkflowExecutionService,
  WorkflowRuntimeRepositoryMemory,
  WorkflowQueue,
} from "@workflow/engine";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import { WorkflowDefinitionHandlers } from "./http/workflow-definitions.ts";
import { WorkflowExecutionHandlers } from "./http/workflow-executions.ts";
import { ServerTaskRegistryLive } from "./tasks.ts";
import { WorkflowWorkerLive } from "./workflow-worker.ts";

const WorkflowQueueLive = WorkflowQueue.memory(1);

const ApiRoutes = HttpApiBuilder.layer(Api, { openapiPath: "/openapi.json" }).pipe(
  Layer.provide(WorkflowDefinitionHandlers),
  Layer.provide(WorkflowExecutionHandlers),
);

const Docs = HttpApiScalar.layer(Api, { path: "/docs" });
const HttpRoutes = Layer.mergeAll(ApiRoutes, Docs);

const ApplicationLive = HttpRouter.serve(HttpRoutes).pipe(
  Layer.provide(WorkflowWorkerLive),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
  Layer.provide(WorkflowDefinitionHandlers),
  Layer.provide(WorkflowExecutionHandlers),
  Layer.provide(WorkflowExecutionService.layer),
  Layer.provide(WorkflowRuntimeRepositoryMemory),
  Layer.provide(ServerTaskRegistryLive),
  Layer.provide(WorkflowDefinitionServiceLive),
  Layer.provide(WorkflowDefinitionRepositoryFile),
  Layer.provide(WorkflowQueueLive),
);

const MainLive = ApplicationLive.pipe(Layer.provideMerge(NodeServices.layer));

Layer.launch(MainLive).pipe(NodeRuntime.runMain);
