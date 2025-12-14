/**
 * Утилиты для работы с Protobuf контрактами и MessagePattern
 *
 * Эти функции обеспечивают конвертацию между форматами:
 * - MessagePattern: "graph-service.createProject"
 * - Protobuf RPC: "GraphService.CreateProject"
 */

/**
 * Конвертирует MessagePattern в имя Protobuf RPC метода
 *
 * @example
 * messagePatternToRpc("graph-service.createProject") // "CreateProject"
 * messagePatternToRpc("codegen-service.generateProject") // "GenerateProject"
 */
export function messagePatternToRpc(messagePattern: string): string {
  const parts = messagePattern.split(".");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid message pattern format: ${messagePattern}. Expected format: "service-name.action"`
    );
  }

  const [, action] = parts;
  // Конвертируем camelCase в PascalCase
  return action.charAt(0).toUpperCase() + action.slice(1);
}

/**
 * Конвертирует имя Protobuf RPC метода в MessagePattern
 *
 * @example
 * rpcToMessagePattern("CreateProject", "graph-service") // "graph-service.createProject"
 * rpcToMessagePattern("GenerateProject", "codegen-service") // "codegen-service.generateProject"
 */
export function rpcToMessagePattern(
  rpcName: string,
  serviceName: string
): string {
  // Конвертируем PascalCase в camelCase
  const action = rpcName.charAt(0).toLowerCase() + rpcName.slice(1);
  return `${serviceName}.${action}`;
}

/**
 * Извлекает имя сервиса из MessagePattern
 *
 * @example
 * extractServiceName("graph-service.createProject") // "graph-service"
 */
export function extractServiceName(messagePattern: string): string {
  const parts = messagePattern.split(".");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid message pattern format: ${messagePattern}. Expected format: "service-name.action"`
    );
  }
  return parts[0];
}

/**
 * Извлекает действие из MessagePattern
 *
 * @example
 * extractAction("graph-service.createProject") // "createProject"
 */
export function extractAction(messagePattern: string): string {
  const parts = messagePattern.split(".");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid message pattern format: ${messagePattern}. Expected format: "service-name.action"`
    );
  }
  return parts[1];
}

/**
 * Конвертирует имя сервиса в формат Protobuf Service
 *
 * @example
 * serviceNameToProtobufService("graph-service") // "GraphService"
 * serviceNameToProtobufService("codegen-service") // "CodegenService"
 */
export function serviceNameToProtobufService(serviceName: string): string {
  return (
    serviceName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("") + "Service"
  );
}

/**
 * Конвертирует имя Protobuf Service в имя сервиса
 *
 * @example
 * protobufServiceToServiceName("GraphService") // "graph-service"
 * protobufServiceToServiceName("CodegenService") // "codegen-service"
 */
export function protobufServiceToServiceName(protobufService: string): string {
  // Убираем "Service" в конце
  const withoutService = protobufService.replace(/Service$/, "");
  // Конвертируем PascalCase в kebab-case
  return withoutService
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .substring(1); // Убираем первый "-"
}

/**
 * Валидирует формат MessagePattern
 *
 * @example
 * isValidMessagePattern("graph-service.createProject") // true
 * isValidMessagePattern("invalid") // false
 */
export function isValidMessagePattern(messagePattern: string): boolean {
  const pattern = /^[a-z0-9-]+\.[a-z][a-zA-Z0-9]*$/;
  return pattern.test(messagePattern);
}

/**
 * Создает полное имя Protobuf RPC метода (ServiceName.RpcName)
 *
 * @example
 * createFullRpcName("graph-service", "createProject") // "GraphService.CreateProject"
 */
export function createFullRpcName(serviceName: string, action: string): string {
  const service = serviceNameToProtobufService(serviceName);
  const rpc = messagePatternToRpc(`${serviceName}.${action}`);
  return `${service}.${rpc}`;
}

/**
 * Парсит полное имя Protobuf RPC метода
 *
 * @example
 * parseFullRpcName("GraphService.CreateProject") // { serviceName: "graph-service", action: "createProject" }
 */
export function parseFullRpcName(fullRpcName: string): {
  serviceName: string;
  action: string;
} {
  const parts = fullRpcName.split(".");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid full RPC name format: ${fullRpcName}. Expected format: "ServiceName.RpcName"`
    );
  }

  const [protobufService, rpcName] = parts;
  const serviceName = protobufServiceToServiceName(protobufService);
  const action = rpcName.charAt(0).toLowerCase() + rpcName.slice(1);

  return { serviceName, action };
}
