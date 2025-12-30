import {
  CODEGEN_SERVICE_NAME,
  GRAPH_SERVICE_NAME,
  AUTH_SERVICE_NAME,
} from "@axion/contracts";
import { AuthModule, HealthModule } from "@axion/nestjs-common";
import { parseKafkaBrokers } from "@axion/shared";
import { createKafkaClientOptions } from "@axion/shared/nest";
import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";

import { CodegenModule } from "@/codegen/codegen.module";
import { env } from "@/config/env";
import { getClient } from "@/database/connection";

@Module({
  imports: [
    // Kafka clients for inter-service communication (must be before other modules)
    ClientsModule.registerAsync([
      {
        name: GRAPH_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            GRAPH_SERVICE_NAME,
            parseKafkaBrokers(env.kafkaBrokers, "localhost:9092")
          ),
      },
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
      serviceName: CODEGEN_SERVICE_NAME,
      getDatabaseClient: () =>
        getClient() as (
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) => Promise<unknown>,
    }),
    CodegenModule,
  ],
  exports: [ClientsModule],
})
export class AppModule {}
