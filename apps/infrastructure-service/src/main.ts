import { INFRASTRUCTURE_SERVICE_NAME } from "@axion/contracts";
import { bootstrapMicroservice } from "@axion/nestjs-common";

import { AppModule } from "@/app.module";
import { env } from "@/config/env";

bootstrapMicroservice(AppModule, {
  serviceName: INFRASTRUCTURE_SERVICE_NAME,
  port: env.port,
  kafkaBrokers: env.kafkaBrokers,
  swagger: {
    serviceName: "Infrastructure Service",
    apiVersion: "v1",
    description:
      "Infrastructure Service API for managing servers, clusters, and system requirements",
  },
}).catch((error) => {
  console.error("Error starting Infrastructure Service:", error);
  process.exit(1);
});
