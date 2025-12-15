/**
 * BullMQ Module для NestJS microservices
 * Предоставляет переиспользуемую настройку BullMQ с подключением к Redis
 *
 * Usage:
 * ```typescript
 * import { BullMQModule } from "@axion/nestjs-common";
 *
 * @Module({
 *   imports: [
 *     BullMQModule.forRootAsync({
 *       useFactory: () => ({
 *         connection: createBullMQConnectionConfig(),
 *       }),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import { DynamicModule, Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import type { BullMQModuleOptions, BullMQModuleAsyncOptions } from "./types";

@Module({})
export class BullMQModule {
  /**
   * Синхронная настройка BullMQ модуля
   */
  static forRoot(options: BullMQModuleOptions): DynamicModule {
    return {
      module: BullMQModule,
      global: false, // Не глобальный, каждый сервис регистрирует свои очереди
      imports: [
        BullModule.forRoot({
          connection: options.connection,
        }),
      ],
      exports: [BullModule],
    };
  }

  /**
   * Асинхронная настройка BullMQ модуля
   */
  static forRootAsync(options: BullMQModuleAsyncOptions): DynamicModule {
    return {
      module: BullMQModule,
      global: false, // Не глобальный, каждый сервис регистрирует свои очереди
      imports: [
        BullModule.forRootAsync({
          useFactory: async () => {
            const config = await options.useFactory();
            return {
              connection: config.connection,
            };
          },
        }),
      ],
      exports: [BullModule],
    };
  }
}
