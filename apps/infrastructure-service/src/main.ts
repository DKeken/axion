import { INFRASTRUCTURE_SERVICE_NAME } from "@axion/contracts";
import { bootstrapMicroservice } from "@axion/nestjs-common";

import { AppModule } from "@/app.module";

bootstrapMicroservice(AppModule, {
  serviceName: INFRASTRUCTURE_SERVICE_NAME,
  defaultPort: 3004,
}).catch((error) => {
  console.error("Error starting Infrastructure Service:", error);
  process.exit(1);
});
