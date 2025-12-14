import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { bootstrapMicroservice } from "@axion/nestjs-common";

import { AppModule } from "@/app.module";

bootstrapMicroservice(AppModule, {
  serviceName: GRAPH_SERVICE_NAME,
  defaultPort: 3001,
}).catch((error) => {
  console.error("Error starting Graph Service:", error);
  process.exit(1);
});
