import {
  GRAPH_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_NAME,
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
import { InfrastructureModule } from "@/infrastructure/infrastructure.module";

@Module({
  imports: [
    // BullMQ для SSH очередей
    BullMQModule.forRootAsync({
      useFactory: () => ({
        connection: createBullMQConnectionConfig(env.redisUrl),
      }),
    }),
    // ⚠️ ВАЖНО: ClientsModule ДОЛЖЕН быть ПЕРВЫМ перед другими модулями
    // Это гарантирует, что Kafka клиенты инициализируются до использования
    ClientsModule.registerAsync([
      {
        name: GRAPH_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            GRAPH_SERVICE_NAME,
            parseKafkaBrokers(env.kafkaBrokers, "localhost:9092")
          ),
      },
    ]),
    // Auth Module (provides guards that use AUTH_SERVICE client)
    AuthModule,
    // Universal Health Module
    HealthModule.forRoot({
      serviceName: INFRASTRUCTURE_SERVICE_NAME,
      getDatabaseClient: () =>
        getClient() as (
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) => Promise<unknown>,
    }),
    InfrastructureModule,
  ],
  // ⚠️ ОБЯЗАТЕЛЬНО экспортируй ClientsModule для использования в дочерних модулях
  exports: [ClientsModule],
})
export class AppModule {}
