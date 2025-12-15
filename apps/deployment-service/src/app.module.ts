import {
  DEPLOYMENT_SERVICE_NAME,
  INFRASTRUCTURE_SERVICE_NAME,
  CODEGEN_SERVICE_NAME,
  GRAPH_SERVICE_NAME,
} from "@axion/contracts";
import { AuthModule, HealthModule } from "@axion/nestjs-common";
import { createKafkaClientOptions } from "@axion/shared";
import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import { BullModule } from "@nestjs/bullmq";

import { db } from "@/database";
import { getClient } from "@/database/connection";
import { DeploymentModule } from "@/deployment/deployment.module";

@Module({
  imports: [
    // BullMQ для очередей деплоя
    // BullMQ root configuration (глобальная настройка подключения к Redis)
    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        // Парсим Redis URL если есть пароль
        const url = new URL(redisUrl);
        const password = url.password || undefined;
        const host = url.hostname || "localhost";
        const port = parseInt(url.port || "6379", 10);

        return {
          connection: {
            host,
            port,
            password,
          },
        };
      },
    }),
    // ⚠️ ВАЖНО: ClientsModule ДОЛЖЕН быть ПЕРВЫМ перед другими модулями
    // Это гарантирует, что Kafka клиенты инициализируются до использования
    ClientsModule.registerAsync([
      {
        name: INFRASTRUCTURE_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            INFRASTRUCTURE_SERVICE_NAME,
            process.env.KAFKA_BROKERS || "localhost:9092"
          ),
      },
      {
        name: CODEGEN_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            CODEGEN_SERVICE_NAME,
            process.env.KAFKA_BROKERS || "localhost:9092"
          ),
      },
      {
        name: GRAPH_SERVICE_NAME,
        useFactory: () =>
          createKafkaClientOptions(
            GRAPH_SERVICE_NAME,
            process.env.KAFKA_BROKERS || "localhost:9092"
          ),
      },
    ]),
    // Better Auth with optional injection for microservice authentication
    AuthModule.forRootAsync({
      useFactory: () => ({
        database: db,
        basePath: "/api/auth",
        trustedOrigins: process.env.TRUSTED_ORIGINS
          ? process.env.TRUSTED_ORIGINS.split(",")
          : [
              "http://localhost:3000",
              "http://localhost:3001",
              "http://traefik.localhost",
              "https://traefik.localhost",
            ],
      }),
    }),
    // Universal Health Module
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
  // ⚠️ ОБЯЗАТЕЛЬНО экспортируй ClientsModule для использования в дочерних модулях
  exports: [ClientsModule],
})
export class AppModule {}
