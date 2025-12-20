import { GRAPH_SERVICE_NAME, AUTH_SERVICE_NAME } from "@axion/contracts";
import { AuthModule, HealthModule } from "@axion/nestjs-common";
import { createKafkaClientOptions, parseKafkaBrokers } from "@axion/shared";
import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";

import { env } from "@/config/env";
import { getClient } from "@/database/connection";
import { GraphModule } from "@/graph/graph.module";

@Module({
  imports: [
    // Auth Service client for session validation (Kafka)
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            AUTH_SERVICE_NAME,
            parseKafkaBrokers(env.kafkaBrokers, "localhost:9092")
          ),
      },
    ]),
    // Auth Module (provides guards that use AUTH_SERVICE client)
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
