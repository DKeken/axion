/**
 * SSH Module для NestJS microservices
 * Предоставляет переиспользуемую SSH функциональность через BullMQ
 *
 * Usage:
 * ```typescript
 * import { SshModule } from "@axion/nestjs-common";
 *
 * @Module({
 *   imports: [
 *     SshModule.forRoot({
 *       // Опционально: предоставить ServerRepository для processors
 *       serverRepository: myServerRepository,
 *     }),
 *   ],
 * })
 * export class MyModule {}
 * ```
 */

import { DynamicModule, Module, Provider } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { SSH_QUEUE_NAMES } from "./queue-names";
import { SshConnectionProcessor } from "./processors/ssh-connection-processor.service";
import { SshCommandProcessor } from "./processors/ssh-command-processor.service";
import { SshInfoCollectorProcessor } from "./processors/ssh-info-collector-processor.service";
import { SshEncryptionService } from "./services/ssh-encryption.service";
import { SshConnectionService } from "./services/ssh-connection.service";
import { SshInfoCollectorService } from "./services/ssh-info-collector.service";
import { SshQueueService } from "./services/ssh-queue.service";

export interface SshModuleOptions {
  /**
   * Опциональный ServerRepository для использования в processors
   * Если не предоставлен, processors не смогут работать с serverId
   */
  serverRepository?: unknown;
}

@Module({})
export class SshModule {
  /**
   * Настройка SSH модуля
   */
  static forRoot(options?: SshModuleOptions): DynamicModule {
    const providers: Provider[] = [
      // Services
      SshEncryptionService,
      SshConnectionService,
      SshInfoCollectorService,
      SshQueueService,
      // Processors
      SshConnectionProcessor,
      SshCommandProcessor,
      SshInfoCollectorProcessor,
    ];

    // Если предоставлен serverRepository, добавляем его как provider
    // Если не предоставлен, processors будут работать только с connectionInfo
    if (options?.serverRepository) {
      providers.push({
        provide: "SERVER_REPOSITORY",
        useValue: options.serverRepository,
      });
    }

    return {
      module: SshModule,
      imports: [
        // Регистрируем SSH очереди
        BullModule.registerQueue({
          name: SSH_QUEUE_NAMES.CONNECTION,
        }),
        BullModule.registerQueue({
          name: SSH_QUEUE_NAMES.COMMAND,
        }),
        BullModule.registerQueue({
          name: SSH_QUEUE_NAMES.INFO_COLLECTION,
        }),
      ],
      providers,
      exports: [
        // Экспортируем сервисы для использования в других модулях
        SshQueueService,
        SshConnectionService,
        SshInfoCollectorService,
        SshEncryptionService,
      ],
    };
  }
}
