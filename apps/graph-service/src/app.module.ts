import { GRAPH_SERVICE_NAME } from "@axion/contracts";
import { AuthModule, HealthModule } from "@axion/nestjs-common";
import { Module } from "@nestjs/common";

import { db } from "@/database";
import { getClient } from "@/database/connection";
import { GraphModule } from "@/graph/graph.module";

@Module({
  imports: [
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
