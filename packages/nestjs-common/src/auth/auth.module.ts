import { AUTH_SERVICE_NAME } from "@axion/contracts";
import { parseKafkaBrokers } from "@axion/shared";
import { createKafkaClientOptions } from "@axion/shared/nest";
import { Module, Global } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";

import { HttpAuthGuard } from "../http/http-auth.guard";

import { AuthHelper } from "./auth-helper";
import { MicroserviceAuthGuard } from "./microservice-auth.guard";

/**
 * Auth Module for NestJS microservices
 * Provides authentication guards and helpers that use auth-service via Kafka
 *
 * Guards automatically use AUTH_SERVICE_NAME Kafka client (injected via @Inject)
 * Bootstrap automatically registers AUTH_SERVICE_NAME client for all services
 */
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE_NAME,
        useFactory: () => {
          // Use a random suffix for the client group to ensure each microservice instance
          // gets its own partitions for reply topics.
          // This prevents "InvalidKafkaClientTopicException" when multiple services
          // share the same AUTH_SERVICE client configuration.
          const instanceId = Math.random().toString(36).substring(2, 10);

          return createKafkaClientOptions(
            AUTH_SERVICE_NAME,
            parseKafkaBrokers(process.env.KAFKA_BROKERS, "localhost:9092"),
            {
              clientIdSuffix: instanceId,
              groupIdSuffix: instanceId,
            }
          );
        },
      },
    ]),
  ],
  providers: [MicroserviceAuthGuard, HttpAuthGuard, AuthHelper],
  exports: [MicroserviceAuthGuard, HttpAuthGuard, AuthHelper, ClientsModule],
})
export class AuthModule {}
