/**
 * SSH utilities for NestJS microservices
 */

// Constants
export { SSH_CONSTANTS } from "./constants";

// Queue Names
export { SSH_QUEUE_NAMES } from "./queue-names";

// Types
export type {
  SshConnectionInfo,
  SshTestConnectionJobPayload,
  SshExecuteCommandJobPayload,
  SshCollectInfoJobPayload,
  SshJobResult,
} from "./types";

// Enums
export { SshOperationType, SshJobStatus } from "./types";

// Services
export { SshEncryptionService } from "./services/ssh-encryption.service";
export { SshConnectionService } from "./services/ssh-connection.service";
export { SshInfoCollectorService } from "./services/ssh-info-collector.service";
export { SshQueueService } from "./services/ssh-queue.service";
// SshQueueService methods are exported via the class itself

// Processors
export { SshConnectionProcessor } from "./processors/ssh-connection-processor.service";
export { SshCommandProcessor } from "./processors/ssh-command-processor.service";
export { SshInfoCollectorProcessor } from "./processors/ssh-info-collector-processor.service";

// Interfaces
export type { IServerRepository } from "./processors/ssh-connection-processor.service";

// Module
export { SshModule, type SshModuleOptions } from "./ssh.module";
