/**
 * SSH Info Collector Service
 * Сбор информации о сервере через SSH команды
 */

import type { ServerInfo } from "@axion/contracts";
import { ServerInfoSchema } from "@axion/contracts";
import { create } from "@bufbuild/protobuf";
import { Injectable, Logger } from "@nestjs/common";
import type { Client } from "ssh2";

import { SSH_CONSTANTS } from "@/ssh/constants";

import { SshConnectionService } from "./ssh-connection.service";

@Injectable()
export class SshInfoCollectorService {
  private readonly logger = new Logger(SshInfoCollectorService.name);

  constructor(private readonly sshConnectionService: SshConnectionService) {}

  /**
   * Сбор информации об операционной системе
   */
  async collectOsInfo(client: Client): Promise<{
    os: string;
    architecture: string;
  }> {
    try {
      const [os, architecture] = await Promise.all([
        this.sshConnectionService.executeCommandSafe(
          client,
          SSH_CONSTANTS.COMMANDS.UNAME_OS
        ),
        this.sshConnectionService.executeCommandSafe(
          client,
          SSH_CONSTANTS.COMMANDS.UNAME_ARCH
        ),
      ]);

      return {
        os: os || "unknown",
        architecture: architecture || "unknown",
      };
    } catch (error) {
      this.logger.error("Failed to collect OS info", error);
      return { os: "unknown", architecture: "unknown" };
    }
  }

  /**
   * Сбор информации о CPU
   */
  async collectCpuInfo(client: Client): Promise<{
    cpuCores: number;
    cpuUsage: number;
  }> {
    try {
      // Количество CPU cores
      const coresOutput = await this.sshConnectionService.executeCommandSafe(
        client,
        SSH_CONSTANTS.COMMANDS.NPROC
      );
      const cpuCores = parseInt(coresOutput, 10) || 0;

      // CPU usage (процент)
      const cpuUsageOutput = await this.sshConnectionService.executeCommandSafe(
        client,
        SSH_CONSTANTS.COMMANDS.CPU_USAGE
      );
      const cpuUsage = parseFloat(cpuUsageOutput) || 0;

      return {
        cpuCores,
        cpuUsage: Math.round(cpuUsage * 100) / 100, // Округляем до 2 знаков
      };
    } catch (error) {
      this.logger.error("Failed to collect CPU info", error);
      return { cpuCores: 0, cpuUsage: 0 };
    }
  }

  /**
   * Сбор информации о памяти
   */
  async collectMemoryInfo(client: Client): Promise<{
    totalMemory: number;
    availableMemory: number;
  }> {
    try {
      const memoryOutput = await this.sshConnectionService.executeCommandSafe(
        client,
        SSH_CONSTANTS.COMMANDS.FREE_MEMORY
      );

      // Парсим вывод free -b:
      //               total        used        free      shared  buff/cache   available
      // Mem:    1234567890  123456789  123456789   12345678   123456789   987654321
      const memLine = memoryOutput
        .split("\n")
        .find((line) => line.startsWith("Mem:"));
      if (memLine) {
        const parts = memLine.split(/\s+/).filter((p) => p);
        const totalMemory = parseInt(parts[1], 10) || 0;
        const availableMemory = parseInt(parts[6], 10) || 0; // available колонка

        return {
          totalMemory,
          availableMemory,
        };
      }

      return { totalMemory: 0, availableMemory: 0 };
    } catch (error) {
      this.logger.error("Failed to collect memory info", error);
      return { totalMemory: 0, availableMemory: 0 };
    }
  }

  /**
   * Проверка наличия и версии Docker
   */
  async checkDocker(client: Client): Promise<{
    dockerInstalled: boolean;
    dockerVersion: string;
  }> {
    try {
      // Проверяем версию Docker
      const versionOutput = await this.sshConnectionService.executeCommandSafe(
        client,
        SSH_CONSTANTS.COMMANDS.DOCKER_VERSION
      );

      if (versionOutput && versionOutput.includes("Docker version")) {
        // Извлекаем версию из вывода (например: "Docker version 24.0.7, build afdd53b")
        const versionMatch = versionOutput.match(/Docker version ([^,]+)/);
        const dockerVersion = versionMatch ? versionMatch[1].trim() : "";

        // Проверяем доступность Docker (docker ps должен работать)
        const psOutput = await this.sshConnectionService.executeCommandSafe(
          client,
          SSH_CONSTANTS.COMMANDS.DOCKER_PS
        );
        const dockerInstalled = psOutput.trim() === "ok";

        return {
          dockerInstalled,
          dockerVersion: dockerInstalled ? dockerVersion : "",
        };
      }

      return { dockerInstalled: false, dockerVersion: "" };
    } catch (error) {
      this.logger.debug(
        "Docker check failed (expected if not installed)",
        error
      );
      return { dockerInstalled: false, dockerVersion: "" };
    }
  }

  /**
   * Сбор всей информации о сервере
   */
  async collectAll(client: Client): Promise<ServerInfo> {
    try {
      const [osInfo, cpuInfo, memoryInfo, dockerInfo] = await Promise.all([
        this.collectOsInfo(client),
        this.collectCpuInfo(client),
        this.collectMemoryInfo(client),
        this.checkDocker(client),
      ]);

      return create(ServerInfoSchema, {
        os: osInfo.os,
        architecture: osInfo.architecture,
        cpuCores: cpuInfo.cpuCores,
        cpuUsage: cpuInfo.cpuUsage,
        totalMemory: BigInt(memoryInfo.totalMemory),
        availableMemory: BigInt(memoryInfo.availableMemory),
        dockerInstalled: dockerInfo.dockerInstalled,
        dockerVersion: dockerInfo.dockerVersion || "",
      });
    } catch (error) {
      this.logger.error("Failed to collect server info", error);
      // Возвращаем минимальную информацию при ошибке
      return create(ServerInfoSchema, {
        os: "",
        architecture: "",
        cpuCores: 0,
        cpuUsage: 0,
        totalMemory: BigInt(0),
        availableMemory: BigInt(0),
        dockerInstalled: false,
        dockerVersion: "",
      });
    }
  }
}
