import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { env } from "./config/env";

/**
 * Root Application Module
 */
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: env.redisUrl,
      },
    }),
    InfrastructureModule,
  ],
})
export class AppModule {}

