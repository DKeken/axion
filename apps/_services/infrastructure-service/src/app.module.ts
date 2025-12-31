import { Module } from "@nestjs/common";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";

/**
 * Root Application Module
 */
@Module({
  imports: [InfrastructureModule],
})
export class AppModule {}

