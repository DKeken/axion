/**
 * SSH Connection Processor
 * Обрабатывает задачи тестирования SSH подключений из очереди BullMQ
 */

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { Job } from "bullmq";

import { SSH_QUEUE_NAMES } from "../queue-names";
import { SshConnectionService } from "../services/ssh-connection.service";
import { SshEncryptionService } from "../services/ssh-encryption.service";
import { SshInfoCollectorService } from "../services/ssh-info-collector.service";
import type {
  SshTestConnectionJobPayload,
  SshJobResult,
  SshConnectionInfo,
} from "../types";

/**
 * Интерфейс для получения сервера из репозитория
 * Используется для инжекции репозитория из infrastructure-service
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
}

@Processor(SSH_QUEUE_NAMES.CONNECTION)
@Injectable()
export class SshConnectionProcessor extends WorkerHost {
  private readonly logger = new Logger(SshConnectionProcessor.name);

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

  async process(job: Job<SshTestConnectionJobPayload>): Promise<SshJobResult> {
    const { serverId, connectionInfo } = job.data;

    this.logger.log(
      `Processing SSH connection test job ${job.id} for server ${serverId || "new connection"}`
    );

    let client = null;

    try {
      // Определяем connection info
      let sshConnectionInfo: SshConnectionInfo;

      if (serverId && this.serverRepository) {
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

        sshConnectionInfo = {
          host: server.host,
          port: server.port,
          username: server.username,
          privateKey,
          password,
        };
      } else if (connectionInfo) {
        // Используем переданную connection info
        sshConnectionInfo = connectionInfo;
      } else {
        throw new Error("Either serverId or connectionInfo must be provided");
      }

      // Подключаемся к серверу
      client = await this.sshConnectionService.connect(sshConnectionInfo);

      // Собираем информацию о сервере
      const serverInfo = await this.sshInfoCollectorService.collectAll(client);

      // Проверяем Docker
      const dockerAvailable = serverInfo.dockerInstalled || false;

      // Возвращаем успешный результат
      return {
        success: true,
        connectionResult: {
          connected: true,
          dockerAvailable,
          serverInfo,
          errorMessage: "",
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        `Failed to process SSH connection test job ${job.id}`,
        error
      );

      // Возвращаем ошибку
      return {
        success: false,
        connectionResult: {
          connected: false,
          dockerAvailable: false,
          serverInfo: {
            os: "",
            architecture: "",
            totalMemory: 0,
            availableMemory: 0,
            cpuCores: 0,
            cpuUsage: 0,
            dockerInstalled: false,
            dockerVersion: "",
          },
          errorMessage,
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
