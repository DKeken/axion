import { DEPLOYMENT_SERVICE_NAME } from "@axion/contracts";
import { bootstrapMicroservice } from "@axion/nestjs-common";

import { AppModule } from "@/app.module";
import { env } from "@/config/env";

bootstrapMicroservice(AppModule, {
  serviceName: DEPLOYMENT_SERVICE_NAME,
  port: env.port,
  kafkaBrokers: env.kafkaBrokers,
}).catch((error) => {
  console.error("Error starting Deployment Service:", error);
  process.exit(1);
});
