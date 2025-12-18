import {
  DEPLOYMENT_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_NAME,
  CODEGEN_SERVICE_NAME,
  GRAPH_SERVICE_NAME,
} from "@axion/contracts";
import {
  AuthModule,
  HealthModule,
  BullMQModule,
  createBullMQConnectionConfig,
} from "@axion/nestjs-common";
import { createKafkaClientOptions, parseKafkaBrokers } from "@axion/shared";
import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";

import { env } from "@/config/env";
import { db } from "@/database";
import { getClient } from "@/database/connection";
import { DeploymentModule } from "@/deployment/deployment.module";

@Module({
  imports: [
    BullMQModule.forRootAsync({
      useFactory: () => ({
        connection: createBullMQConnectionConfig(env.redisUrl),
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: INFRASTRUCTURE_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            INFRASTRUCTURE_SERVICE_NAME,
            parseKafkaBrokers(env.kafkaBrokers, "localhost:9092")
          ),
      },
      {
        name: CODEGEN_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            CODEGEN_SERVICE_NAME,
            parseKafkaBrokers(env.kafkaBrokers, "localhost:9092")
          ),
      },
      {
        name: GRAPH_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            GRAPH_SERVICE_NAME,
            parseKafkaBrokers(env.kafkaBrokers, "localhost:9092")
          ),
      },
    ]),
    AuthModule.forRootAsync({
      useFactory: () => ({
        database: db,
        basePath: "/api/auth",
        trustedOrigins: env.trustedOrigins,
      }),
    }),
    HealthModule.forRoot({
      serviceName: DEPLOYMENT_SERVICE_NAME,
      getDatabaseClient: () =>
        getClient() as (
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) => Promise<unknown>,
    }),
    DeploymentModule,
  ],
  exports: [ClientsModule],
})
export class AppModule {}
