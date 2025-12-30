import { randomUUID } from "node:crypto";

import {
  createFullPagination,
  createServerResponse,
  createListServersResponse,
  ServerStatus,
  serverStatusToDbString,
  createTestServerConnectionResponse,
  type CreateServerRequest,
  type DeleteServerRequest,
  type GetServerRequest,
  type ListServersRequest,
  type UpdateServerRequest,
  type TestServerConnectionRequest,
  type TestServerConnectionResponse,
  type ServerConnectionTestResult,
} from "@axion/contracts";
import {
  CatchError,
  SshQueueService,
  SSH_CONSTANTS,
  type SshConnectionInfo,
  type SshTestConnectionJobPayload,
  SshEncryptionService,
} from "@axion/nestjs-common";
import { BaseService, enforceLimit } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { env } from "@/config/env";
import { verifyServerAccess } from "@/infrastructure/helpers/server-access.helper";
import { transformServerToContract } from "@/infrastructure/helpers/type-transformers";
import { ServerRepository } from "@/infrastructure/repositories/server.repository";

@Injectable()
export class ServersService extends BaseService {
  constructor(
    private readonly serverRepository: ServerRepository,
    private readonly sshQueueService: SshQueueService,
    private readonly sshEncryptionService: SshEncryptionService
  ) {
    super(ServersService.name);
  }

  @CatchError({ operation: "creating server" })
  async create(data: CreateServerRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    const serversCount = await this.serverRepository.countByUserId(
      metadataCheck.userId
    );
    const limitCheck = enforceLimit(
      "servers",
      serversCount,
      env.maxServersPerUser
    );
    if (!limitCheck.success) return limitCheck.response;

    // Валидация обязательных полей
    if (!data.host || !data.username) {
      return this.createValidationResponse("host and username are required");
    }

    // Шифрование SSH ключа или пароля перед сохранением
    const encryptedPrivateKey = this.sshEncryptionService.encrypt(
      data.privateKey
    );
    const encryptedPassword = this.sshEncryptionService.encrypt(data.password);

    if (!encryptedPrivateKey && !encryptedPassword) {
      return this.createValidationResponse(
        "either private_key or password is required"
      );
    }

    const server = await this.serverRepository.create({
      userId: metadataCheck.userId,
      clusterId: data.clusterId || null,
      host: data.host,
      port: data.port || 22,
      username: data.username,
      encryptedPrivateKey,
      encryptedPassword,
      name: data.name,
      description: data.description || null,
      status: serverStatusToDbString(ServerStatus.SERVER_STATUS_PENDING),
    });

    return createServerResponse(transformServerToContract(server));
  }

  @CatchError({ operation: "getting server" })
  async get(data: GetServerRequest) {
    const access = await verifyServerAccess(
      this.serverRepository,
      data.serverId,
      data.metadata
    );
    if (!access.success) return access.response;

    const server = await this.serverRepository.findById(data.serverId);
    if (!server) {
      return this.createNotFoundResponse("Server", data.serverId);
    }

    return createServerResponse(transformServerToContract(server));
  }

  @CatchError({ operation: "updating server" })
  async update(data: UpdateServerRequest) {
    const access = await verifyServerAccess(
      this.serverRepository,
      data.serverId,
      data.metadata
    );
    if (!access.success) return access.response;

    const updated = await this.serverRepository.update(data.serverId, {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.clusterId !== undefined && {
        clusterId: data.clusterId || null,
      }),
      // Примечание: privateKey и password не могут быть обновлены через UpdateServerRequest
      // (не включены в proto контракт для безопасности)
    });

    if (!updated) {
      return this.createNotFoundResponse("Server", data.serverId);
    }

    return createServerResponse(transformServerToContract(updated));
  }

  @CatchError({ operation: "deleting server" })
  async delete(data: DeleteServerRequest) {
    const access = await verifyServerAccess(
      this.serverRepository,
      data.serverId,
      data.metadata
    );
    if (!access.success) return access.response;

    const deleted = await this.serverRepository.delete(data.serverId);
    if (!deleted) {
      return this.createNotFoundResponse("Server", data.serverId);
    }

    return { status: 1 }; // STATUS_SUCCESS
  }

  @CatchError({ operation: "listing servers" })
  async list(data: ListServersRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    const { page, limit } = this.extractPagination(data.pagination);

    let result;
    if (data.clusterId) {
      result = await this.serverRepository.findByClusterId(
        data.clusterId,
        page,
        limit
      );
    } else {
      result = await this.serverRepository.findByUserId(
        metadataCheck.userId,
        page,
        limit
      );
    }

    return createListServersResponse(
      result.servers.map(transformServerToContract),
      createFullPagination({ page, limit }, result.total)
    );
  }

  @CatchError({ operation: "testing server connection" })
  async testConnection(
    data: TestServerConnectionRequest
  ): Promise<TestServerConnectionResponse> {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) {
      return metadataCheck.response;
    }

    try {
      // Подготавливаем payload для SSH job
      let sshConnectionInfo: SshConnectionInfo | undefined;

      if (data.serverId) {
        // Проверяем доступ к существующему серверу
        const access = await verifyServerAccess(
          this.serverRepository,
          data.serverId,
          data.metadata
        );
        if (!access.success) {
          return access.response;
        }

        const existingServer = await this.serverRepository.findById(
          data.serverId
        );
        if (!existingServer) {
          return this.createNotFoundResponse("Server", data.serverId);
        }
      } else if (data.connectionInfo) {
        // Подготавливаем connection info для нового сервера
        sshConnectionInfo = {
          host: data.connectionInfo.host,
          port: data.connectionInfo.port || SSH_CONSTANTS.DEFAULT_PORT,
          username: data.connectionInfo.username,
          privateKey: data.connectionInfo.privateKey || null,
          password: data.connectionInfo.password || null,
        };
      } else {
        return this.createValidationResponse(
          "either server_id or connection_info is required"
        );
      }

      // Создаем SSH job для тестирования подключения
      const jobId = await this.sshQueueService.createTestConnectionJob({
        serverId: data.serverId,
        connectionInfo: sshConnectionInfo,
        metadata: this.buildSshMetadata(metadataCheck.userId, data.metadata),
      });

      // Ждем результата выполнения job (с таймаутом 60 секунд)
      const jobResult = await this.sshQueueService.waitForConnectionJobResult(
        jobId,
        60000
      );

      if (!jobResult.success || !jobResult.connectionResult) {
        // Обработка ошибки
        const errorMessage = jobResult.error || "Connection test failed";

        // Если это существующий сервер - обновляем статус на error
        if (data.serverId) {
          try {
            await this.serverRepository.update(data.serverId, {
              status: serverStatusToDbString(ServerStatus.SERVER_STATUS_ERROR),
            });
          } catch (updateError) {
            this.logger.error(
              "Failed to update server status after connection test error",
              updateError
            );
          }
        }

        const result: ServerConnectionTestResult = {
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
        };

        return createTestServerConnectionResponse(result);
      }

      // Успешный результат
      const connectionResult = jobResult.connectionResult;

      // Если это существующий сервер - обновляем информацию в БД
      if (data.serverId) {
        // Обновляем serverInfo
        await this.serverRepository.updateServerInfo(
          data.serverId,
          connectionResult.serverInfo
        );

        // Обновляем статус и lastConnectedAt
        await this.serverRepository.update(data.serverId, {
          status: serverStatusToDbString(ServerStatus.SERVER_STATUS_CONNECTED),
        });
        await this.serverRepository.updateLastConnected(data.serverId);
      }

      const result: ServerConnectionTestResult = {
        connected: connectionResult.connected,
        dockerAvailable: connectionResult.dockerAvailable,
        serverInfo: {
          os: connectionResult.serverInfo.os || "",
          architecture: connectionResult.serverInfo.architecture || "",
          totalMemory: connectionResult.serverInfo.totalMemory || 0,
          availableMemory: connectionResult.serverInfo.availableMemory || 0,
          cpuCores: connectionResult.serverInfo.cpuCores || 0,
          cpuUsage: connectionResult.serverInfo.cpuUsage || 0,
          dockerInstalled: connectionResult.serverInfo.dockerInstalled || false,
          dockerVersion: connectionResult.serverInfo.dockerVersion || "",
        },
        errorMessage: connectionResult.errorMessage || "",
      };

      return createTestServerConnectionResponse(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error("Failed to test server connection", error);

      // Если это существующий сервер - обновляем статус на error
      if (data.serverId) {
        try {
          await this.serverRepository.update(data.serverId, {
            status: serverStatusToDbString(ServerStatus.SERVER_STATUS_ERROR),
          });
        } catch (updateError) {
          this.logger.error(
            "Failed to update server status after connection test error",
            updateError
          );
        }
      }

      const result: ServerConnectionTestResult = {
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
      };

      return createTestServerConnectionResponse(result);
    }
  }

  private buildSshMetadata(
    userId: string,
    metadata: TestServerConnectionRequest["metadata"]
  ): SshTestConnectionJobPayload["metadata"] {
    if (!metadata) {
      return {
        userId,
        projectId: "",
        requestId: randomUUID(),
        timestamp: Date.now(),
      };
    }

    return {
      userId,
      requestId: metadata.requestId,
      projectId: metadata.projectId,
      timestamp: metadata.timestamp,
    };
  }
}
