import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { AuthModule, HealthModule } from "@axion/nestjs-common";
import { Module } from "@nestjs/common";

import { getClient } from "@/database/connection";
import { GraphModule } from "@/graph/graph.module";

@Module({
  imports: [
    // Auth Module (provides guards and Kafka client)
    AuthModule,
    // Universal Health Module
    HealthModule.forRoot({
      serviceName: GRAPH_SERVICE_NAME,
      getDatabaseClient: () =>
        getClient() as (
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) => Promise<unknown>,
    }),
    GraphModule,
  ],
})
export class AppModule {}
