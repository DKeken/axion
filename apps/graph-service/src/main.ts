import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { bootstrapMicroservice } from "@axion/nestjs-common";

import { AppModule } from "@/app.module";
import { env } from "@/config/env";

bootstrapMicroservice(AppModule, {
  serviceName: GRAPH_SERVICE_NAME,
  port: env.port,
  kafkaBrokers: env.kafkaBrokers,
  swagger: {
    serviceName: "Graph Service",
    apiVersion: "v1",
    description:
      "Graph Service API for managing projects, graphs, and services",
  },
}).catch((error) => {
  console.error("Error starting Graph Service:", error);
  process.exit(1);
});
