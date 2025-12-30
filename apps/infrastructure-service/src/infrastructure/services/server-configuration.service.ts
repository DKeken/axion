/**
 * Server Configuration Service
 * Автоматическая настройка серверов через SSH
 */

import { randomUUID } from "node:crypto";

import {
  createConfigureServerResponse,
  createCalculateSystemRequirementsResponse,
  createError as createContractError,
  Status,
  type CalculateSystemRequirementsRequest,
  type CalculateSystemRequirementsResponse,
  type ConfigureServerRequest,
  type ConfigureServerResponse,
  type ServerInfo,
} from "@axion/contracts";
import {
  CatchError,
  SshQueueService,
  SSH_CONSTANTS,
  type SshExecuteCommandJobPayload,
} from "@axion/nestjs-common";
import { BaseService, type ErrorResponse } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { type Server } from "@/database/schema";
import { verifyServerAccess } from "@/infrastructure/helpers/server-access.helper";
import {
  calculateSystemRequirements,
  type SystemRequirementsResult,
} from "@/infrastructure/helpers/system-requirements.helper";
import { ServerRepository } from "@/infrastructure/repositories/server.repository";

@Injectable()
export class ServerConfigurationService extends BaseService {
  constructor(
    private readonly serverRepository: ServerRepository,
    private readonly sshQueueService: SshQueueService
  ) {
    super(ServerConfigurationService.name);
  }

  @CatchError({ operation: "configuring server" })
  async configureServer(
    data: ConfigureServerRequest
  ): Promise<ConfigureServerResponse> {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) {
      return this.mapErrorToConfigureResponse(metadataCheck.response);
    }

    // Проверяем доступ к серверу
    const access = await verifyServerAccess(
      this.serverRepository,
      data.serverId,
      data.metadata
    );
    if (!access.success) {
      return this.mapErrorToConfigureResponse(access.response);
    }

    // Получаем сервер из БД
    const server = await this.serverRepository.findById(data.serverId);
    if (!server) {
      const notFoundResponse = this.createNotFoundResponse(
        "Server",
        data.serverId
      );
      return this.mapErrorToConfigureResponse(notFoundResponse);
    }

    const configurationLog: string[] = [];
    const result = {
      directoriesCreated: false,
      userCreated: false,
      dockerInstalled: false,
      firewallConfigured: false,
    };

    const metadata = this.buildSshMetadata(data.metadata, metadataCheck.userId);

    try {
      // 1. Проверка/установка Docker
      if (data.installDocker) {
        configurationLog.push("Checking Docker installation...");

        const dockerCheckJobId =
          await this.sshQueueService.createExecuteCommandJob({
            serverId: data.serverId,
            command: SSH_CONSTANTS.SETUP_COMMANDS.CHECK_DOCKER,
            safe: true,
            metadata,
          });

        const dockerCheckResult =
          await this.sshQueueService.waitForCommandJobResult(
            dockerCheckJobId,
            30000
          );

        if (
          !dockerCheckResult.success ||
          !dockerCheckResult.commandResult?.stdout.includes("Docker version")
        ) {
          configurationLog.push("Docker not found, installing...");

          const dockerInstallJobId =
            await this.sshQueueService.createExecuteCommandJob({
              serverId: data.serverId,
              command: SSH_CONSTANTS.SETUP_COMMANDS.INSTALL_DOCKER,
              metadata,
            });

          const dockerInstallResult =
            await this.sshQueueService.waitForCommandJobResult(
              dockerInstallJobId,
              300000 // 5 минут для установки Docker
            );

          if (!dockerInstallResult.success) {
            throw new Error(
              `Docker installation failed: ${dockerInstallResult.commandResult?.stderr || dockerInstallResult.error}`
            );
          }

          result.dockerInstalled = true;
          configurationLog.push("✓ Docker installed successfully");
        } else {
          configurationLog.push("✓ Docker already installed");
        }
      }

      // 2. Создание директорий
      configurationLog.push("Creating directories...");

      const createDirsJobId =
        await this.sshQueueService.createExecuteCommandJob({
          serverId: data.serverId,
          command: SSH_CONSTANTS.SETUP_COMMANDS.CREATE_DIRECTORIES,
          metadata,
        });

      const createDirsResult =
        await this.sshQueueService.waitForCommandJobResult(
          createDirsJobId,
          60000
        );

      if (!createDirsResult.success) {
        throw new Error(
          `Failed to create directories: ${createDirsResult.commandResult?.stderr || createDirsResult.error}`
        );
      }

      result.directoriesCreated = true;
      configurationLog.push("✓ Directories created");

      // 3. Создание пользователя axion
      configurationLog.push("Checking user 'axion'...");

      const checkUserJobId = await this.sshQueueService.createExecuteCommandJob(
        {
          serverId: data.serverId,
          command: SSH_CONSTANTS.SETUP_COMMANDS.CHECK_USER,
          safe: true,
          metadata,
        }
      );

      const checkUserResult =
        await this.sshQueueService.waitForCommandJobResult(
          checkUserJobId,
          30000
        );

      const userExists =
        checkUserResult.success &&
        checkUserResult.commandResult?.stdout &&
        !checkUserResult.commandResult.stdout.includes("not_exists");

      if (!userExists) {
        configurationLog.push("Creating user 'axion'...");

        const createUserJobId =
          await this.sshQueueService.createExecuteCommandJob({
            serverId: data.serverId,
            command: SSH_CONSTANTS.SETUP_COMMANDS.CREATE_USER,
            metadata,
          });

        const createUserResult =
          await this.sshQueueService.waitForCommandJobResult(
            createUserJobId,
            60000
          );

        if (!createUserResult.success) {
          throw new Error(
            `Failed to create user: ${createUserResult.commandResult?.stderr || createUserResult.error}`
          );
        }

        result.userCreated = true;
        configurationLog.push("✓ User 'axion' created");
      } else {
        configurationLog.push("✓ User 'axion' already exists");
      }

      // Добавление пользователя в группу docker
      configurationLog.push("Adding user to docker group...");

      const addToDockerJobId =
        await this.sshQueueService.createExecuteCommandJob({
          serverId: data.serverId,
          command: SSH_CONSTANTS.SETUP_COMMANDS.ADD_USER_TO_DOCKER,
          metadata,
        });

      const addToDockerResult =
        await this.sshQueueService.waitForCommandJobResult(
          addToDockerJobId,
          60000
        );

      if (!addToDockerResult.success) {
        this.logger.warn(
          `Failed to add user to docker group: ${addToDockerResult.commandResult?.stderr || addToDockerResult.error}`
        );
        configurationLog.push(
          `⚠ Warning: Failed to add user to docker group (may require manual setup)`
        );
      } else {
        configurationLog.push("✓ User added to docker group");
      }

      // Установка прав на директории после создания пользователя
      configurationLog.push("Setting directory ownership...");

      const setOwnershipJobId =
        await this.sshQueueService.createExecuteCommandJob({
          serverId: data.serverId,
          command: SSH_CONSTANTS.SETUP_COMMANDS.SET_DIRECTORIES_OWNERSHIP,
          metadata,
        });

      const setOwnershipResult =
        await this.sshQueueService.waitForCommandJobResult(
          setOwnershipJobId,
          60000
        );

      if (!setOwnershipResult.success) {
        this.logger.warn(
          `Failed to set directory ownership: ${setOwnershipResult.commandResult?.stderr || setOwnershipResult.error}`
        );
        configurationLog.push(
          `⚠ Warning: Failed to set directory ownership (may require manual setup)`
        );
      } else {
        configurationLog.push("✓ Directory ownership set");
      }

      // 4. Настройка firewall (если запрошено)
      if (data.setupFirewall) {
        configurationLog.push("Configuring firewall...");

        // Проверка наличия ufw
        const checkUfwJobId =
          await this.sshQueueService.createExecuteCommandJob({
            serverId: data.serverId,
            command: SSH_CONSTANTS.SETUP_COMMANDS.CHECK_UFW,
            safe: true,
            metadata,
          });

        const checkUfwResult =
          await this.sshQueueService.waitForCommandJobResult(
            checkUfwJobId,
            30000
          );

        const ufwInstalled =
          checkUfwResult.success &&
          checkUfwResult.commandResult?.stdout &&
          !checkUfwResult.commandResult.stdout.includes("not_installed");

        if (!ufwInstalled) {
          configurationLog.push("Installing ufw...");

          const installUfwJobId =
            await this.sshQueueService.createExecuteCommandJob({
              serverId: data.serverId,
              command: SSH_CONSTANTS.SETUP_COMMANDS.INSTALL_UFW,
              metadata,
            });

          const installUfwResult =
            await this.sshQueueService.waitForCommandJobResult(
              installUfwJobId,
              120000 // 2 минуты для установки
            );

          if (!installUfwResult.success) {
            this.logger.warn(
              `Failed to install ufw: ${installUfwResult.commandResult?.stderr || installUfwResult.error}`
            );
            configurationLog.push(
              `⚠ Warning: Failed to install ufw (firewall configuration skipped)`
            );
          } else {
            configurationLog.push("✓ ufw installed");
          }
        }

        // Настройка правил firewall
        if (ufwInstalled || checkUfwResult.success) {
          const firewallCommands = [
            { cmd: SSH_CONSTANTS.SETUP_COMMANDS.UFW_ALLOW_SSH, desc: "SSH" },
            { cmd: SSH_CONSTANTS.SETUP_COMMANDS.UFW_ALLOW_HTTP, desc: "HTTP" },
            {
              cmd: SSH_CONSTANTS.SETUP_COMMANDS.UFW_ALLOW_HTTPS,
              desc: "HTTPS",
            },
            {
              cmd: SSH_CONSTANTS.SETUP_COMMANDS.UFW_ALLOW_DOCKER_SWARM,
              desc: "Docker Swarm",
            },
          ];

          for (const { cmd, desc } of firewallCommands) {
            const firewallJobId =
              await this.sshQueueService.createExecuteCommandJob({
                serverId: data.serverId,
                command: cmd,
                safe: true, // Используем safe для firewall команд (некоторые могут уже быть настроены)
                metadata,
              });

            const firewallResult =
              await this.sshQueueService.waitForCommandJobResult(
                firewallJobId,
                60000
              );

            if (firewallResult.success) {
              configurationLog.push(`✓ Firewall rule for ${desc} added`);
            } else {
              configurationLog.push(
                `⚠ Warning: Failed to add firewall rule for ${desc}`
              );
            }
          }

          // Включение firewall
          const enableFirewallJobId =
            await this.sshQueueService.createExecuteCommandJob({
              serverId: data.serverId,
              command: SSH_CONSTANTS.SETUP_COMMANDS.UFW_ENABLE,
              safe: true, // Может быть уже включен
              metadata,
            });

          const enableFirewallResult =
            await this.sshQueueService.waitForCommandJobResult(
              enableFirewallJobId,
              60000
            );

          if (enableFirewallResult.success) {
            result.firewallConfigured = true;
            configurationLog.push("✓ Firewall enabled");
          } else {
            configurationLog.push(
              "⚠ Warning: Failed to enable firewall (may already be enabled)"
            );
          }
        }
      }

      configurationLog.push("Server configuration completed successfully");

      // Возвращаем результат
      return createConfigureServerResponse({
        directoriesCreated: result.directoriesCreated,
        userCreated: result.userCreated,
        dockerInstalled: result.dockerInstalled,
        firewallConfigured: result.firewallConfigured,
        configurationLog: configurationLog.join("\n"),
      });
    } catch (configError) {
      const errorMessage =
        configError instanceof Error ? configError.message : "Unknown error";

      this.logger.error(
        `Failed to configure server ${data.serverId}`,
        configError
      );

      // Возвращаем ошибку
      const contractError = createContractError(
        "SERVER_CONFIGURATION_FAILED",
        errorMessage,
        {}
      );
      return {
        status: Status.STATUS_ERROR,
        error: contractError,
      };
    }
  }

  /**
   * Высчитывает требования к инфраструктуре исходя из количества сервисов.
   * Если указан serverId, используется фактическая конфигурация сервера для проверки fit.
   */
  async calculateSystemRequirements(
    data: CalculateSystemRequirementsRequest
  ): Promise<CalculateSystemRequirementsResponse> {
    const metadataCheck = this.validateMetadata(data.metadata);

    if (!metadataCheck.success) {
      return {
        status: metadataCheck.response.status,
        error: metadataCheck.response.result?.error,
      };
    }

    let serverInfo: ServerInfo | undefined;

    if (data.serverId) {
      const access = await verifyServerAccess(
        this.serverRepository,
        data.serverId,
        data.metadata
      );
      if (!access.success) {
        return {
          status: access.response.status,
          error: access.response.result?.error,
        };
      }

      const server = await this.serverRepository.findById(data.serverId);
      if (!server) {
        const notFound = this.createNotFoundResponse("Server", data.serverId);
        return {
          status: notFound.status,
          error: notFound.result?.error,
        };
      }

      serverInfo = this.mapServerInfo(server.serverInfo);
    }

    const estimation: SystemRequirementsResult = calculateSystemRequirements({
      services: data.services,
      averageCpuCores: data.averageCpuCores,
      averageMemoryMb: data.averageMemoryMb,
      averageDiskGb: data.averageDiskGb,
      replicas: data.replicas,
      overheadPercent: data.overheadPercent,
      serverInfo,
    });

    return createCalculateSystemRequirementsResponse({
      requiredCpuCores: estimation.requiredCpuCores,
      requiredMemoryMb: estimation.requiredMemoryMb,
      requiredDiskGb: estimation.requiredDiskGb,
      recommendedServers: estimation.recommendedServers,
      fitsCurrentServer: estimation.fitsCurrentServer,
      headroomPercent: estimation.headroomPercent,
      notes: estimation.notes,
    });
  }

  private mapErrorToConfigureResponse(
    errorResponse: ErrorResponse
  ): ConfigureServerResponse {
    return {
      status: errorResponse.status,
      error: errorResponse.result?.error,
    };
  }

  private buildSshMetadata(
    metadata: ConfigureServerRequest["metadata"],
    userId: string
  ): SshExecuteCommandJobPayload["metadata"] {
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

  private mapServerInfo(
    serverInfo: Server["serverInfo"]
  ): ServerInfo | undefined {
    if (!serverInfo) {
      return undefined;
    }

    return {
      os: serverInfo.os ?? "",
      architecture: serverInfo.architecture ?? "",
      totalMemory: serverInfo.totalMemory ?? 0,
      availableMemory: serverInfo.availableMemory ?? 0,
      cpuCores: serverInfo.cpuCores ?? 0,
      cpuUsage: serverInfo.cpuUsage ?? 0,
      dockerInstalled: serverInfo.dockerInstalled ?? false,
      dockerVersion: serverInfo.dockerVersion ?? "",
    };
  }
}
