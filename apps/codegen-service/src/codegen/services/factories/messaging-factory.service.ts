import {
  type GraphData,
  type Node,
  NodeType,
  EdgeType,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, handleServiceError } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import {
  RABBITMQ_DEFAULTS,
  TEMPLATE_PATHS,
} from "@/codegen/constants/template-engine.constants";
import { TemplateEngineService } from "@/codegen/services/template-engine.service";
import type { MessagingComponents } from "@/codegen/types/factory.types";

/**
 * Messaging Factory Service
 * Автоматически создает messaging компоненты (RabbitMQ server, client) из графа
 */
@Injectable()
export class MessagingFactoryService extends BaseService {
  private static readonly DEFAULT_VHOST = "default";
  private static readonly DEFAULT_SERVICE_NAME = "service";

  constructor(private readonly templateEngine: TemplateEngineService) {
    super(MessagingFactoryService.name);
  }

  /**
   * Создает messaging компоненты для сервиса
   * @param serviceNode - service node из графа
   * @param graph - полный граф проекта
   * @returns объект с сгенерированными файлами messaging компонентов
   */
  @CatchError({ operation: "creating messaging components" })
  async createMessagingComponents(
    serviceNode: Node,
    graph: GraphData
  ): Promise<MessagingComponents> {
    // Валидация типа ноды
    if (serviceNode.type !== NodeType.NODE_TYPE_SERVICE) {
      return handleServiceError(
        this.logger,
        "validating service node type",
        new Error(`Expected service node, got node type: ${serviceNode.type}`),
        {
          operation: "validating service node type",
          additional: {
            nodeId: serviceNode.id,
            nodeType: serviceNode.type,
          },
        }
      ) as never;
    }

    const nodeData = serviceNode.data as Record<string, unknown> | undefined;
    const serviceName =
      (nodeData?.name as string) ||
      MessagingFactoryService.DEFAULT_SERVICE_NAME;
    const projectId = (nodeData?.projectId as string) || "";

    this.logger.log(
      `Creating messaging components for service ${serviceNode.id} (${serviceName})`
    );

    try {
      // Генерируем RabbitMQ server код
      const serverCode = await this.generateRabbitMQServer(
        serviceName,
        projectId
      );

      // Проверяем, есть ли исходящие edges (сервис вызывает другие сервисы)
      const outgoingEdges =
        graph.edges?.filter((edge) => edge.source === serviceNode.id) || [];

      const hasOutgoingCalls = outgoingEdges.some(
        (edge) =>
          edge.type === EdgeType.EDGE_TYPE_RABBITMQ ||
          edge.type === EdgeType.EDGE_TYPE_HTTP
      );

      let clientCode: string | undefined;
      if (hasOutgoingCalls) {
        // Генерируем RabbitMQ client код, если сервис вызывает другие сервисы
        clientCode = await this.generateRabbitMQClient(serviceName, projectId);
      }

      return {
        server: serverCode,
        client: clientCode,
      };
    } catch (error) {
      return handleServiceError(
        this.logger,
        "creating messaging components",
        error,
        {
          operation: "creating messaging components",
          additional: {
            nodeId: serviceNode.id,
            serviceName,
            projectId,
          },
        }
      ) as never;
    }
  }

  /**
   * Генерирует RabbitMQ server код
   */
  @CatchError({ operation: "generating RabbitMQ server code" })
  private async generateRabbitMQServer(
    serviceName: string,
    projectId: string
  ): Promise<string> {
    const templatePath = `${TEMPLATE_PATHS.COMPONENTS}/rabbitmq-server.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    const vhost = projectId
      ? `project_${projectId}`
      : MessagingFactoryService.DEFAULT_VHOST;
    const queueName = `${serviceName}-queue`;

    const result = this.templateEngine.substituteVariables(template, {
      SERVICE_NAME: serviceName,
      VHOST: vhost,
      QUEUE_PREFIX: RABBITMQ_DEFAULTS.QUEUE_PREFIX,
      QUEUE_NAME: queueName,
      HANDLERS: "// Handlers will be registered here",
    });

    return result.content;
  }

  /**
   * Генерирует RabbitMQ client код
   */
  @CatchError({ operation: "generating RabbitMQ client code" })
  private async generateRabbitMQClient(
    serviceName: string,
    projectId: string
  ): Promise<string> {
    const templatePath = `${TEMPLATE_PATHS.COMPONENTS}/rabbitmq-client.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    const vhost = projectId
      ? `project_${projectId}`
      : MessagingFactoryService.DEFAULT_VHOST;

    const result = this.templateEngine.substituteVariables(template, {
      SERVICE_NAME: serviceName,
      VHOST: vhost,
      RABBITMQ_URL: `process.env.RABBITMQ_URL || '${RABBITMQ_DEFAULTS.DEFAULT_URL}'`,
    });

    return result.content;
  }

  /**
   * Генерирует код для инициализации messaging в main.ts
   */
  @CatchError({ operation: "generating messaging initialization code" })
  async generateMessagingInitializationCode(
    serverCode: string,
    clientCode?: string
  ): Promise<string> {
    let initCode = `// Initialize RabbitMQ server
${serverCode}`;

    if (clientCode) {
      initCode += `\n\n// Initialize RabbitMQ client
${clientCode}`;
    }

    return initCode;
  }
}
