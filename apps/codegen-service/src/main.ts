import { CODEGEN_SERVICE_NAME } from "@axion/contracts";
import { bootstrapMicroservice } from "@axion/nestjs-common";

import { AppModule } from "@/app.module";

bootstrapMicroservice(AppModule, {
  serviceName: CODEGEN_SERVICE_NAME,
  defaultPort: 3002,
}).catch((error) => {
  console.error("Error starting Codegen Service:", error);
  process.exit(1);
});
