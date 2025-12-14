/**
 * Brand types for type-safe contract strings
 */

/**
 * MessagePattern type - строка в формате "service-name.action"
 */
export type MessagePattern = string & { readonly __brand: "MessagePattern" };

/**
 * Service Name type - строка в формате "service-name"
 */
export type ServiceName = string & { readonly __brand: "ServiceName" };

/**
 * RPC Name type - строка в формате "RpcName"
 */
export type RpcName = string & { readonly __brand: "RpcName" };

/**
 * Type guard для проверки MessagePattern
 */
export function isMessagePattern(value: string): value is MessagePattern {
  const pattern = /^[a-z0-9-]+\.[a-z][a-zA-Z0-9]*$/;
  return pattern.test(value);
}

/**
 * Type guard для проверки ServiceName
 */
export function isServiceName(value: string): value is ServiceName {
  const pattern = /^[a-z0-9-]+$/;
  return pattern.test(value);
}
