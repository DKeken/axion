import { DEPLOYMENT_SERVICE_NAME } from "@axion/contracts";
import { bootstrapMicroservice } from "@axion/nestjs-common";

import { AppModule } from "@/app.module";

bootstrapMicroservice(AppModule, {
  serviceName: DEPLOYMENT_SERVICE_NAME,
  defaultPort: 3005,
}).catch((error) => {
  console.error("Error starting Deployment Service:", error);
  process.exit(1);
});
