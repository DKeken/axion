import {
  DEPLOYMENT_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_NAME,
  CODEGEN_SERVICE_NAME,
  GRAPH_SERVICE_NAME,
  RUNNER_AGENT_SERVICE_NAME,
  AUTH_SERVICE_NAME,
} from "@axion/contracts";
import {
  AuthModule,
  HealthModule,
  BullMQModule,
  createBullMQConnectionConfig,
} from "@axion/nestjs-common";
import { parseKafkaBrokers } from "@axion/shared";
import { createKafkaClientOptions } from "@axion/shared/nest";
import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";

import { env } from "@/config/env";
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
      {
        name: RUNNER_AGENT_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            RUNNER_AGENT_SERVICE_NAME,
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
