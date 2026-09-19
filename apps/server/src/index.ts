import { createServer } from "node:http";

import { NodeHttpServer, NodeRuntime, NodeServices } from "@effect/platform-node";
import { Api } from "@workflow/api";
import {
  WorkflowDefinitionRepositoryFile,
  WorkflowDefinitionServiceLive,
  WorkflowExecutionService,
  WorkflowQueue,
  WorkflowRuntimeRepositoryMemory,
} from "@workflow/engine";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import { WorkflowDefinitionHandlers } from "./http/workflow-definitions.ts";
import { WorkflowExecutionHandlers } from "./http/workflow-executions.ts";
import { ServerTaskRegistryLive } from "./tasks.ts";
import { WorkflowWorkerLive } from "./workflow-worker.ts";

const WorkflowDefinitionServicesLive = WorkflowDefinitionServiceLive.pipe(
  Layer.provideMerge(WorkflowDefinitionRepositoryFile),
);

const WorkflowQueueLive = WorkflowQueue.memory(1);

const WorkflowExecutionDependenciesLive = Layer.mergeAll(
  WorkflowDefinitionServicesLive,
  WorkflowRuntimeRepositoryMemory,
  ServerTaskRegistryLive,
  WorkflowQueueLive,
);

const WorkflowEngineLive = WorkflowExecutionService.layer.pipe(
  Layer.provideMerge(WorkflowExecutionDependenciesLive),
);

const ApiRoutes = HttpApiBuilder.layer(Api, { openapiPath: "/openapi.json" }).pipe(
  Layer.provide(WorkflowDefinitionHandlers),
  Layer.provide(WorkflowExecutionHandlers),
);

const Docs = HttpApiScalar.layer(Api, { path: "/docs" });
const HttpRoutes = Layer.mergeAll(ApiRoutes, Docs);

const ApplicationLive = HttpRouter.serve(HttpRoutes).pipe(
  Layer.provide(WorkflowWorkerLive),
  Layer.provide(WorkflowEngineLive),
  Layer.provide(NodeHttpServer.layer(createServer, { port: Number(process.env.PORT ?? 3000) })),
);

const MainLive = ApplicationLive.pipe(Layer.provideMerge(NodeServices.layer));

Layer.launch(MainLive).pipe(NodeRuntime.runMain);
