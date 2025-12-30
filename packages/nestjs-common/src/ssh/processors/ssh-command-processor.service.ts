/**
 * SSH Command Processor
 * Обрабатывает задачи выполнения SSH команд из очереди BullMQ
 */

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { Job } from "bullmq";

import { SSH_QUEUE_NAMES } from "../queue-names";
import { SshConnectionService } from "../services/ssh-connection.service";
import { SshEncryptionService } from "../services/ssh-encryption.service";
import type {
  SshExecuteCommandJobPayload,
  SshJobResult,
  SshConnectionInfo,
} from "../types";

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
}

@Processor(SSH_QUEUE_NAMES.COMMAND)
@Injectable()
export class SshCommandProcessor extends WorkerHost {
  private readonly logger = new Logger(SshCommandProcessor.name);

  constructor(
    private readonly sshConnectionService: SshConnectionService,
    private readonly sshEncryptionService: SshEncryptionService,
    @Optional()
    @Inject("SERVER_REPOSITORY")
    private readonly serverRepository?: IServerRepository
  ) {
    super();
  }

  async process(job: Job<SshExecuteCommandJobPayload>): Promise<SshJobResult> {
    const { serverId, command, timeout, safe } = job.data;

    this.logger.log(
      `Processing SSH command job ${job.id} for server ${serverId}, command: ${command.substring(0, 50)}...`
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

      // Выполняем команду
      let stdout = "";
      let stderr = "";
      let exitCode = 0;

      try {
        if (safe) {
          stdout = await this.sshConnectionService.executeCommandSafe(
            client,
            command,
            timeout
          );
        } else {
          stdout = await this.sshConnectionService.executeCommand(
            client,
            command,
            timeout
          );
        }
      } catch (commandError) {
        exitCode = 1;
        const errorMessage =
          commandError instanceof Error
            ? commandError.message
            : String(commandError);
        stderr = errorMessage;

        if (!safe) {
          throw commandError;
        }
      }

      // Возвращаем успешный результат
      return {
        success: exitCode === 0,
        commandResult: {
          stdout,
          stderr,
          exitCode,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(`Failed to process SSH command job ${job.id}`, error);

      // Возвращаем ошибку
      return {
        success: false,
        commandResult: {
          stdout: "",
          stderr: errorMessage,
          exitCode: 1,
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
