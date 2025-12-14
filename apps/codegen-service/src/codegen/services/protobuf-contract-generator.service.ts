import {
  type GraphData,
  type Node,
  NodeType,
  EdgeType,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

/**
 * Protobuf Contract Generator Service
 * Генерирует Protobuf контракты из графа проекта
 */
@Injectable()
export class ProtobufContractGeneratorService extends BaseService {
  private static readonly PROTO_SYNTAX = "proto3";
  private static readonly DEFAULT_PACKAGE = "axion.generated";

  constructor() {
    super(ProtobufContractGeneratorService.name);
  }

  /**
   * Генерирует Protobuf контракты для всех сервисов в графе
   * @param graph - граф проекта
   * @param projectName - имя проекта
   * @returns Map с именами сервисов и их proto файлами
   */
  @CatchError({ operation: "generating protobuf contracts" })
  async generateContracts(
    graph: GraphData,
    projectName: string
  ): Promise<Map<string, string>> {
    const contracts = new Map<string, string>();

    if (!graph.nodes) {
      this.logger.warn("Graph has no nodes, returning empty contracts");
      return contracts;
    }

    // Генерируем контракты для каждого service node
    for (const node of graph.nodes) {
      if (node.type === NodeType.NODE_TYPE_SERVICE) {
        try {
          const serviceName = this.extractServiceName(node);
          const protoContent = await this.generateServiceProto(
            node,
            graph,
            projectName,
            serviceName
          );
          contracts.set(serviceName, protoContent);
        } catch (error) {
          this.logger.error(
            `Failed to generate proto for service node ${node.id}`,
            error
          );
          // Продолжаем генерацию для других сервисов
        }
      }
    }

    this.logger.log(
      `Generated ${contracts.size} protobuf contracts for project ${projectName}`
    );

    return contracts;
  }

  /**
   * Генерирует Protobuf контракт для одного сервиса
   */
  @CatchError({ operation: "generating service proto contract" })
  private async generateServiceProto(
    serviceNode: Node,
    graph: GraphData,
    projectName: string,
    serviceName: string
  ): Promise<string> {
    const packageName = `${ProtobufContractGeneratorService.DEFAULT_PACKAGE}.${this.toSnakeCase(projectName)}`;
    const serviceNamePascal = this.toPascalCase(serviceName);

    // Находим все edges, связанные с этим сервисом
    const incomingEdges =
      graph.edges?.filter((edge) => edge.target === serviceNode.id) || [];

    // Генерируем сообщения для запросов и ответов
    const messages = this.generateMessages(serviceNamePascal);
    const serviceDefinition = this.generateServiceDefinition(
      serviceNamePascal,
      incomingEdges
    );

    // Собираем proto файл
    const protoContent = `syntax = "${ProtobufContractGeneratorService.PROTO_SYNTAX}";

package ${packageName};

import "google/protobuf/empty.proto";

${messages}

service ${serviceNamePascal}Service {
${serviceDefinition}
}
`;

    return protoContent;
  }

  /**
   * Генерирует сообщения для запросов и ответов
   */
  private generateMessages(serviceNamePascal: string): string {
    const messages: string[] = [];

    // Генерируем базовые CRUD сообщения
    messages.push(
      `// Request messages
message Create${serviceNamePascal}Request {
  string id = 1;
  map<string, string> data = 2;
}

message Get${serviceNamePascal}Request {
  string id = 1;
}

message Update${serviceNamePascal}Request {
  string id = 1;
  map<string, string> data = 2;
}

message Delete${serviceNamePascal}Request {
  string id = 1;
}

message List${serviceNamePascal}sRequest {
  int32 page = 1;
  int32 limit = 2;
}

// Response messages
message ${serviceNamePascal}Response {
  string id = 1;
  map<string, string> data = 2;
  int64 created_at = 3;
  int64 updated_at = 4;
}

message List${serviceNamePascal}sResponse {
  repeated ${serviceNamePascal}Response items = 1;
  int32 total = 2;
  int32 page = 3;
  int32 limit = 4;
}`
    );

    return messages.join("\n\n");
  }

  /**
   * Генерирует определение сервиса с методами
   */
  private generateServiceDefinition(
    serviceNamePascal: string,
    edges: Array<{ id: string; type: EdgeType; source: string; target: string }>
  ): string {
    const methods: string[] = [];

    // Базовые CRUD методы
    methods.push(
      `  // CRUD operations
  rpc Create${serviceNamePascal}(Create${serviceNamePascal}Request) returns (${serviceNamePascal}Response);
  rpc Get${serviceNamePascal}(Get${serviceNamePascal}Request) returns (${serviceNamePascal}Response);
  rpc Update${serviceNamePascal}(Update${serviceNamePascal}Request) returns (${serviceNamePascal}Response);
  rpc Delete${serviceNamePascal}(Delete${serviceNamePascal}Request) returns (google.protobuf.Empty);
  rpc List${serviceNamePascal}s(List${serviceNamePascal}sRequest) returns (List${serviceNamePascal}sResponse);`
    );

    // Добавляем методы на основе edges (если есть специфичные паттерны)
    for (const edge of edges) {
      if (edge.type === EdgeType.EDGE_TYPE_RABBITMQ) {
        // Для RabbitMQ edges можно добавить специфичные методы
        const methodName = this.toPascalCase(edge.id);
        methods.push(
          `  rpc ${methodName}(google.protobuf.Empty) returns (google.protobuf.Empty);`
        );
      }
    }

    return methods.join("\n");
  }

  /**
   * Извлекает имя сервиса из node
   */
  private extractServiceName(node: Node): string {
    const nodeData = node.data as Record<string, unknown> | undefined;
    return (
      (nodeData?.name as string) ||
      (nodeData?.service_name as string) ||
      `service-${node.id.slice(0, 8)}`
    );
  }

  /**
   * Преобразует строку в PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(/[\s_-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }

  /**
   * Преобразует строку в snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  }
}
