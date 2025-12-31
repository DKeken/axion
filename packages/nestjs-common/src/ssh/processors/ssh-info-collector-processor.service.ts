/**
 * SSH Info Collector Processor
 * Обрабатывает задачи сбора информации о сервере из очереди BullMQ
 */

import { ServerInfoSchema } from "@axion/contracts";
import { create } from "@bufbuild/protobuf";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { Job } from "bullmq";

import { SSH_QUEUE_NAMES } from "@/ssh/queue-names";
import { SshConnectionService } from "@/ssh/services/ssh-connection.service";
import { SshEncryptionService } from "@/ssh/services/ssh-encryption.service";
import { SshInfoCollectorService } from "@/ssh/services/ssh-info-collector.service";
import type {
  SshCollectInfoJobPayload,
  SshJobResult,
  SshConnectionInfo,
} from "@/ssh/types";

/**
 * Интерфейс для получения сервера из репозитория
 */
export type IServerRepository = {
  findById(id: string): Promise<{
    id: string;
    host: string;
    port: number;
    username: string;
    encryptedPrivateKey: string | null;
    encryptedPassword: string | null;
  } | null>;
};

@Processor(SSH_QUEUE_NAMES.INFO_COLLECTION)
@Injectable()
export class SshInfoCollectorProcessor extends WorkerHost {
  private readonly logger = new Logger(SshInfoCollectorProcessor.name);

  constructor(
    private readonly sshConnectionService: SshConnectionService,
    private readonly sshInfoCollectorService: SshInfoCollectorService,
    private readonly sshEncryptionService: SshEncryptionService,
    @Optional()
    @Inject("SERVER_REPOSITORY")
    private readonly serverRepository?: IServerRepository
  ) {
    super();
  }

  async process(job: Job<SshCollectInfoJobPayload>): Promise<SshJobResult> {
    const { serverId } = job.data;

    this.logger.log(
      `Processing SSH info collection job ${job.id} for server ${serverId}`
    );

    let client = null;

    try {
      if (!this.serverRepository) {
        throw new Error("Server repository not available");
      }

      // Получаем сервер из БД
      const server = await this.serverRepository.findById(serverId);
      if (!server) {
        throw new Error(`Server ${serverId} not found`);
      }

      // Расшифровываем SSH ключи
      const privateKey = server.encryptedPrivateKey
        ? this.sshEncryptionService.decrypt(server.encryptedPrivateKey)
        : null;
      const password = server.encryptedPassword
        ? this.sshEncryptionService.decrypt(server.encryptedPassword)
        : null;

      if (!privateKey && !password) {
        throw new Error(
          "Neither private key nor password is available for server"
        );
      }

      const sshConnectionInfo: SshConnectionInfo = {
        host: server.host,
        port: server.port,
        username: server.username,
        privateKey,
        password,
      };

      // Подключаемся к серверу
      client = await this.sshConnectionService.connect(sshConnectionInfo);

      // Собираем информацию о сервере
      const serverInfo = await this.sshInfoCollectorService.collectAll(client);

      // Возвращаем успешный результат
      return {
        success: true,
        infoResult: {
          serverInfo,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        `Failed to process SSH info collection job ${job.id}`,
        error
      );

      // Возвращаем ошибку
      return {
        success: false,
        infoResult: {
          serverInfo: create(ServerInfoSchema, {
            os: "",
            architecture: "",
            totalMemory: BigInt(0),
            availableMemory: BigInt(0),
            cpuCores: 0,
            cpuUsage: 0,
            dockerInstalled: false,
            dockerVersion: "",
          }),
        },
        error: errorMessage,
      };
    } finally {
      // Закрываем SSH соединение
      if (client) {
        try {
          await this.sshConnectionService.disconnect(client);
        } catch (disconnectError) {
          this.logger.error(
            `Failed to disconnect SSH client for job ${job.id}`,
            disconnectError
          );
        }
      }
    }
  }
}
