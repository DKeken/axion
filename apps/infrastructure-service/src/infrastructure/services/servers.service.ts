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
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { verifyServerAccess } from "@/infrastructure/helpers/server-access.helper";
import { transformServerToContract } from "@/infrastructure/helpers/type-transformers";
import { type ServerRepository } from "@/infrastructure/repositories/server.repository";

@Injectable()
export class ServersService extends BaseService {
  constructor(private readonly serverRepository: ServerRepository) {
    super(ServersService.name);
  }

  @CatchError({ operation: "creating server" })
  async create(data: CreateServerRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    // Валидация обязательных полей
    if (!data.host || !data.username) {
      return this.createValidationResponse("host and username are required");
    }

    // TODO: Шифрование SSH ключа или пароля
    // Пока сохраняем как есть (в production нужно шифровать)
    const encryptedPrivateKey = data.privateKey || null;
    const encryptedPassword = data.password || null;

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

    // TODO: Реализовать реальную проверку SSH подключения
    // Пока возвращаем заглушку
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
      errorMessage: "Connection test not implemented yet",
    };

    return createTestServerConnectionResponse(result);
  }
}
