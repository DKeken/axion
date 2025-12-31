/**
 * SSH Connection Service
 * Управление SSH подключениями к серверам
 */

import { Injectable, Logger } from "@nestjs/common";
import { Client, ConnectConfig } from "ssh2";

import { SSH_CONSTANTS } from "@/ssh/constants";
import { type SshConnectionInfo } from "@/ssh/types";

@Injectable()
export class SshConnectionService {
  private readonly logger = new Logger(SshConnectionService.name);

  constructor() {}

  /**
   * Создание SSH подключения с использованием connection_info
   *
   * @param connectionInfo - информация о подключении
   * @returns Promise с SSH клиентом
   */
  async connect(connectionInfo: SshConnectionInfo): Promise<Client> {
    if (!connectionInfo.privateKey && !connectionInfo.password) {
      throw new Error("Either private key or password is required");
    }

    const config: ConnectConfig = {
      host: connectionInfo.host,
      port: connectionInfo.port,
      username: connectionInfo.username,
      readyTimeout: SSH_CONSTANTS.DEFAULT_CONNECTION_TIMEOUT,
      strictVendor: SSH_CONSTANTS.CONNECTION_CONFIG.strictVendor,
    };

    if (connectionInfo.privateKey) {
      config.privateKey = connectionInfo.privateKey;
    }

    if (connectionInfo.password) {
      config.password = connectionInfo.password;
    }

    return new Promise((resolve, reject) => {
      const client = new Client();
      let connected = false;

      const timeout = setTimeout(() => {
        if (!connected) {
          client.end();
          reject(new Error("SSH connection timeout"));
        }
      }, SSH_CONSTANTS.DEFAULT_CONNECTION_TIMEOUT);

      client
        .on("ready", () => {
          connected = true;
          clearTimeout(timeout);
          this.logger.log(
            `SSH connected to ${connectionInfo.host}:${connectionInfo.port}`
          );
          resolve(client);
        })
        .on("error", (err) => {
          clearTimeout(timeout);
          if (!connected) {
            this.logger.error(
              `Failed to connect to ${connectionInfo.host}:${connectionInfo.port}`,
              err
            );
            reject(err);
          }
        })
        .connect(config);
    });
  }

  /**
   * Выполнение команды через SSH
   *
   * @param client - SSH клиент
   * @param command - команда для выполнения
   * @param timeout - таймаут выполнения команды (по умолчанию из констант)
   * @returns Promise с выводом команды (stdout)
   */
  async executeCommand(
    client: Client,
    command: string,
    timeout: number = SSH_CONSTANTS.DEFAULT_COMMAND_TIMEOUT
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Command timeout: ${command}`));
      }, timeout);

      client.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(err);
          return;
        }

        let stdout = "";
        let stderr = "";

        stream
          .on("close", (code: number | null) => {
            clearTimeout(timeoutId);
            if (code !== 0) {
              reject(
                new Error(
                  `Command failed with code ${code}: ${stderr || stdout}`
                )
              );
            } else {
              resolve(stdout.trim());
            }
          })
          .on("data", (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on("data", (data: Buffer) => {
            stderr += data.toString();
          });
      });
    });
  }

  /**
   * Выполнение команды с обработкой ошибок (возвращает пустую строку при ошибке)
   * Полезно для команд, которые могут не выполняться (например, docker --version)
   *
   * @param client - SSH клиент
   * @param command - команда для выполнения
   * @param timeout - таймаут выполнения команды
   * @returns Promise с выводом команды или пустой строкой при ошибке
   */
  async executeCommandSafe(
    client: Client,
    command: string,
    timeout: number = SSH_CONSTANTS.DEFAULT_COMMAND_TIMEOUT
  ): Promise<string> {
    try {
      return await this.executeCommand(client, command, timeout);
    } catch (error) {
      this.logger.debug(`Command failed (safe mode): ${command}`, error);
      return "";
    }
  }

  /**
   * Закрытие SSH соединения
   *
   * @param client - SSH клиент
   */
  async disconnect(client: Client): Promise<void> {
    return new Promise((resolve) => {
      client.end();
      client.on("close", () => {
        this.logger.debug("SSH connection closed");
        resolve();
      });
    });
  }
}
