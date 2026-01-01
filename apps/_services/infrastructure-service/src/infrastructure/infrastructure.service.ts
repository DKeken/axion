import { Injectable, Logger } from "@nestjs/common";
import { create } from "@bufbuild/protobuf";
import {
  type CreateClusterRequest,
  type CreateClusterResponse,
  type GetClusterRequest,
  type GetClusterResponse,
  type ListClustersRequest,
  type ListClustersResponse,
  type UpdateClusterRequest,
  type UpdateClusterResponse,
  type DeleteClusterRequest,
  type DeleteClusterResponse,
  type RegisterServerRequest,
  type RegisterServerResponse,
  type GetServerRequest,
  type GetServerResponse,
  type ListServersRequest,
  type ListServersResponse,
  type UpdateServerStatusRequest,
  type UpdateServerStatusResponse,
  type DeleteServerRequest,
  type DeleteServerResponse,
  getUserIdFromMetadata,
  createNotFoundError,
  createValidationError,
  CreateClusterResponseSchema,
  GetClusterResponseSchema,
  ListClustersResponseSchema,
  UpdateClusterResponseSchema,
  DeleteClusterResponseSchema,
  ClusterListSchema,
  RegisterServerResponseSchema,
  GetServerResponseSchema,
  ListServersResponseSchema,
  UpdateServerStatusResponseSchema,
  DeleteServerResponseSchema,
  ServerListSchema,
  ServerRegistrationSchema,
  ConfigureServerResponseSchema,
  TestServerConnectionResponseSchema,
  ServerInfoSchema,
  type ConfigureServerRequest,
  type ConfigureServerResponse,
  type TestServerConnectionRequest,
  type TestServerConnectionResponse,
} from "@axion/contracts";
import { EmptySchema } from "@axion/contracts/generated/common/common_pb";
import { handleServiceErrorTyped } from "@axion/shared";
import {
  SshConnectionService,
  SshEncryptionService,
  SshQueueService,
  SshInfoCollectorService,
} from "@axion/nestjs-common";
import { ServerRepository } from "./repositories/server.repository";
import { AgentRepository } from "./repositories/agent.repository";
import { ClusterRepository } from "./repositories/cluster.repository";
import { ServerMapper } from "./mappers/server.mapper";
import { ClusterMapper } from "./mappers/cluster.mapper";
import { env } from "@/config/env";

/**
 * Infrastructure Service
 * Handles server registration, management, and agent installation
 */
@Injectable()
export class InfrastructureService {
  private readonly logger = new Logger(InfrastructureService.name);

  constructor(
    private readonly serverRepository: ServerRepository,
    private readonly agentRepository: AgentRepository,
    private readonly clusterRepository: ClusterRepository,
    private readonly sshConnectionService: SshConnectionService,
    private readonly sshEncryptionService: SshEncryptionService,
    private readonly sshQueueService: SshQueueService,
    private readonly sshInfoCollectorService: SshInfoCollectorService
  ) {}

  // ========================================================================
  // Cluster Operations
  // ========================================================================

  async createCluster(
    data: CreateClusterRequest
  ): Promise<CreateClusterResponse> {
    const userId = getUserIdFromMetadata(data.metadata);
    if (!userId) {
      return create(CreateClusterResponseSchema, {
        result: {
          case: "error",
          value: createValidationError("user_id is required in metadata"),
        },
      });
    }

    try {
      const cluster = await this.clusterRepository.create({
        userId,
        name: data.name,
        description: data.description,
        metadata: data.metadataFields || {},
      });

      return create(CreateClusterResponseSchema, {
        result: {
          case: "cluster",
          value: ClusterMapper.toProto(cluster),
        },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        CreateClusterResponseSchema,
        this.logger,
        "creating cluster",
        error,
        {
          resourceType: "Cluster",
          userId,
        }
      );
    }
  }

  async getCluster(data: GetClusterRequest): Promise<GetClusterResponse> {
    try {
      const cluster = await this.clusterRepository.findById(data.clusterId);
      if (!cluster) {
        return create(GetClusterResponseSchema, {
          result: {
            case: "error",
            value: createNotFoundError("Cluster", data.clusterId),
          },
        });
      }

      return create(GetClusterResponseSchema, {
        result: {
          case: "cluster",
          value: ClusterMapper.toProto(cluster),
        },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        GetClusterResponseSchema,
        this.logger,
        "getting cluster",
        error,
        {
          resourceType: "Cluster",
          resourceId: data.clusterId,
        }
      );
    }
  }

  async listClusters(data: ListClustersRequest): Promise<ListClustersResponse> {
    const userId = getUserIdFromMetadata(data.metadata);
    if (!userId) {
      return create(ListClustersResponseSchema, {
        result: {
          case: "error",
          value: createValidationError("user_id is required in metadata"),
        },
      });
    }

    try {
      const limit = data.pagination?.limit || 10;
      const offset = data.pagination?.page
        ? (data.pagination.page - 1) * limit
        : 0;

      const clusters = await this.clusterRepository.findByUserId(
        userId,
        limit,
        offset
      );
      const total = await this.clusterRepository.countByUserId(userId);

      return create(ListClustersResponseSchema, {
        result: {
          case: "clusters",
          value: create(ClusterListSchema, {
            clusters: clusters.map(ClusterMapper.toProto),
            pagination: {
              page: data.pagination?.page || 1,
              limit: data.pagination?.limit || 10,
              total: total,
            },
          }),
        },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        ListClustersResponseSchema,
        this.logger,
        "listing clusters",
        error,
        {
          resourceType: "Cluster",
          userId,
        }
      );
    }
  }

  async updateCluster(
    data: UpdateClusterRequest
  ): Promise<UpdateClusterResponse> {
    try {
      const updated = await this.clusterRepository.update(data.clusterId, {
        name: data.name,
        description: data.description,
      });

      if (!updated) {
        return create(UpdateClusterResponseSchema, {
          result: {
            case: "error",
            value: createNotFoundError("Cluster", data.clusterId),
          },
        });
      }

      return create(UpdateClusterResponseSchema, {
        result: {
          case: "cluster",
          value: ClusterMapper.toProto(updated),
        },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        UpdateClusterResponseSchema,
        this.logger,
        "updating cluster",
        error,
        {
          resourceType: "Cluster",
          resourceId: data.clusterId,
        }
      );
    }
  }

  async deleteCluster(
    data: DeleteClusterRequest
  ): Promise<DeleteClusterResponse> {
    try {
      const deleted = await this.clusterRepository.delete(data.clusterId);
      if (!deleted) {
        return create(DeleteClusterResponseSchema, {
          result: {
            case: "error",
            value: createNotFoundError("Cluster", data.clusterId),
          },
        });
      }

      return create(DeleteClusterResponseSchema, {
        result: { case: "success", value: create(EmptySchema, {}) },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        DeleteClusterResponseSchema,
        this.logger,
        "deleting cluster",
        error,
        {
          resourceType: "Cluster",
          resourceId: data.clusterId,
        }
      );
    }
  }

  // ========================================================================
  // Server Operations
  // ========================================================================

  async registerServer(
    data: RegisterServerRequest
  ): Promise<RegisterServerResponse> {
    const userId = getUserIdFromMetadata(data.metadata);
    if (!userId) {
      return create(RegisterServerResponseSchema, {
        result: {
          case: "error",
          value: createValidationError("user_id is required in metadata"),
        },
      });
    }

    try {
      if (data.clusterId) {
        const cluster = await this.clusterRepository.findById(data.clusterId);
        if (!cluster) {
          return create(RegisterServerResponseSchema, {
            result: {
              case: "error",
              value: createNotFoundError("Cluster", data.clusterId),
            },
          });
        }
        if (cluster.userId !== userId) {
          return create(RegisterServerResponseSchema, {
            result: {
              case: "error",
              value: createValidationError("Cluster does not belong to user"),
            },
          });
        }
      }

      const serverCount = await this.serverRepository.countByUserId(userId);
      if (serverCount >= env.maxServersPerUser) {
        return create(RegisterServerResponseSchema, {
          result: {
            case: "error",
            value: createValidationError(
              `Maximum number of servers (${env.maxServersPerUser}) reached for user`
            ),
          },
        });
      }

      const now = new Date();
      const server = await this.serverRepository.create({
        userId,
        name: data.name,
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        status: "ONLINE",
        metadata: data.metadataFields || {},
        lastHeartbeat: now,
        clusterId: data.clusterId || undefined,
      });

      const agentToken = `agent-${server.id}-${crypto.randomUUID()}`;
      await this.agentRepository.create({
        serverId: server.id,
        version: "0.1.0",
        status: "CONNECTED",
        capabilities: {},
        token: agentToken,
        lastHeartbeat: now,
      });

      return create(RegisterServerResponseSchema, {
        result: {
          case: "registration",
          value: create(ServerRegistrationSchema, {
            server: ServerMapper.toProto(server),
            agentToken,
            config: {
              heartbeatInterval: "30s",
              logLevel: "info",
            },
          }),
        },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        RegisterServerResponseSchema,
        this.logger,
        "registering server",
        error,
        {
          resourceType: "Server",
          userId,
        }
      );
    }
  }

  async getServer(data: GetServerRequest): Promise<GetServerResponse> {
    try {
      const server = await this.serverRepository.findById(data.serverId);
      if (!server) {
        return create(GetServerResponseSchema, {
          result: {
            case: "error",
            value: createNotFoundError("Server", data.serverId),
          },
        });
      }

      return create(GetServerResponseSchema, {
        result: { case: "server", value: ServerMapper.toProto(server) },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        GetServerResponseSchema,
        this.logger,
        "getting server",
        error,
        {
          resourceType: "Server",
          resourceId: data.serverId,
        }
      );
    }
  }

  async listServers(data: ListServersRequest): Promise<ListServersResponse> {
    const userId = getUserIdFromMetadata(data.metadata);
    if (!userId) {
      return create(ListServersResponseSchema, {
        result: {
          case: "error",
          value: createValidationError("user_id is required in metadata"),
        },
      });
    }

    try {
      const limit = data.pagination?.limit || 10;
      const offset = data.pagination?.page
        ? (data.pagination.page - 1) * limit
        : 0;

      const servers = await this.serverRepository.findByUserId(
        userId,
        limit,
        offset,
        data.clusterId || undefined
      );

      const total = await this.serverRepository.countByUserId(userId);

      return create(ListServersResponseSchema, {
        result: {
          case: "servers",
          value: create(ServerListSchema, {
            servers: servers.map(ServerMapper.toProto),
            pagination: {
              page: data.pagination?.page || 1,
              limit: data.pagination?.limit || 10,
              total: total,
            },
          }),
        },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        ListServersResponseSchema,
        this.logger,
        "listing servers",
        error,
        {
          resourceType: "Server",
          userId,
        }
      );
    }
  }

  async updateServerStatus(
    data: UpdateServerStatusRequest
  ): Promise<UpdateServerStatusResponse> {
    try {
      const updated = await this.serverRepository.update(data.serverId, {
        status: ServerMapper.statusFromProto(data.status),
      });

      if (!updated) {
        return create(UpdateServerStatusResponseSchema, {
          result: {
            case: "error",
            value: createNotFoundError("Server", data.serverId),
          },
        });
      }

      return create(UpdateServerStatusResponseSchema, {
        result: { case: "server", value: ServerMapper.toProto(updated) },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        UpdateServerStatusResponseSchema,
        this.logger,
        "updating server status",
        error,
        {
          resourceType: "Server",
          resourceId: data.serverId,
        }
      );
    }
  }

  async deleteServer(data: DeleteServerRequest): Promise<DeleteServerResponse> {
    try {
      const deleted = await this.serverRepository.delete(data.serverId);
      if (!deleted) {
        return create(DeleteServerResponseSchema, {
          result: {
            case: "error",
            value: createNotFoundError("Server", data.serverId),
          },
        });
      }

      return create(DeleteServerResponseSchema, {
        result: { case: "success", value: create(EmptySchema, {}) },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        DeleteServerResponseSchema,
        this.logger,
        "deleting server",
        error,
        {
          resourceType: "Server",
          resourceId: data.serverId,
        }
      );
    }
  }

  async configureServer(
    data: ConfigureServerRequest
  ): Promise<ConfigureServerResponse> {
    const userId = getUserIdFromMetadata(data.metadata);
    if (!userId) {
      return create(ConfigureServerResponseSchema, {
        result: {
          case: "error",
          value: createValidationError("user_id is required in metadata"),
        },
      });
    }

    try {
      const server = await this.serverRepository.findById(data.serverId);
      if (!server) {
        return create(ConfigureServerResponseSchema, {
          result: {
            case: "error",
            value: createNotFoundError("Server", data.serverId),
          },
        });
      }

      if (server.userId !== userId) {
        return create(ConfigureServerResponseSchema, {
          result: {
            case: "error",
            value: createValidationError("Server does not belong to user"),
          },
        });
      }

      const { credentials } = data;
      if (!credentials) {
        return create(ConfigureServerResponseSchema, {
          result: {
            case: "error",
            value: createValidationError("credentials are required"),
          },
        });
      }

      // Encrypt credentials
      const encryptedPassword = credentials.password
        ? this.sshEncryptionService.encrypt(credentials.password)
        : undefined;
      const encryptedPrivateKey = credentials.privateKey
        ? this.sshEncryptionService.encrypt(credentials.privateKey)
        : undefined;
      const encryptedPassphrase = credentials.passphrase
        ? this.sshEncryptionService.encrypt(credentials.passphrase)
        : undefined;

      // Update server with encrypted credentials
      await this.serverRepository.update(data.serverId, {
        sshUsername: credentials.username,
        sshPort: credentials.port || 22,
        encryptedSshPassword: encryptedPassword,
        encryptedSshPrivateKey: encryptedPrivateKey,
        encryptedSshPassphrase: encryptedPassphrase,
      });

      // Queue a connection test to verify credentials
      // We pass connectionInfo explicitly because we don't have ServerRepository injected in SshModule
      await this.sshQueueService.createTestConnectionJob({
        serverId: data.serverId,
        connectionInfo: {
          host: server.ipAddress,
          port: credentials.port || 22,
          username: credentials.username,
          password: credentials.password,
          privateKey: credentials.privateKey,
          passphrase: credentials.passphrase,
        },
      });

      return create(ConfigureServerResponseSchema, {
        result: { case: "success", value: create(EmptySchema, {}) },
      });
    } catch (error) {
      return handleServiceErrorTyped(
        ConfigureServerResponseSchema,
        this.logger,
        "configuring server",
        error,
        {
          resourceType: "Server",
          resourceId: data.serverId,
        }
      );
    }
  }

  async testServerConnection(
    data: TestServerConnectionRequest
  ): Promise<TestServerConnectionResponse> {
    try {
      const { credentials, hostname } = data;
      if (!credentials) {
        return create(TestServerConnectionResponseSchema, {
          result: {
            case: "error",
            value: createValidationError("credentials are required"),
          },
        });
      }

      // Use SshConnectionService directly for synchronous feedback
      const client = await this.sshConnectionService.connect({
        host: hostname,
        port: credentials.port || 22,
        username: credentials.username,
        password: credentials.password,
        privateKey: credentials.privateKey,
        passphrase: credentials.passphrase,
      });

      try {
        const info = await this.sshInfoCollectorService.collectAll(client);

        return create(TestServerConnectionResponseSchema, {
          result: {
            case: "info",
            value: create(ServerInfoSchema, {
              os: info.os,
              architecture: info.architecture,
              cpuCores: info.cpuCores,
              cpuUsage: info.cpuUsage,
              totalMemory: BigInt(info.totalMemory),
              availableMemory: BigInt(info.availableMemory),
              dockerInstalled: info.dockerInstalled,
              dockerVersion: info.dockerVersion || "",
            }),
          },
        });
      } finally {
        await this.sshConnectionService.disconnect(client);
      }
    } catch (error) {
      return handleServiceErrorTyped(
        TestServerConnectionResponseSchema,
        this.logger,
        "testing server connection",
        error
      );
    }
  }
}
