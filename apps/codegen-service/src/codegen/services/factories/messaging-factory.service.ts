import {
  type GraphData,
  type Node,
  NodeType,
  EdgeType,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, handleServiceError } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { TEMPLATE_PATHS } from "@/codegen/constants/template-engine.constants";
import { TemplateEngineService } from "@/codegen/services/template-engine.service";
import type { MessagingComponents } from "@/codegen/types/factory.types";

/**
 * Messaging Factory Service
 * Автоматически создает messaging компоненты для service-to-service вызовов.
 *
 * Генерируем HTTP RPC для межсервисного общения:
 * - server: принимает POST {RPC_PATH_PREFIX}/:pattern и вызывает зарегистрированные handlers
 * - client: отправляет POST на другой сервис по адресу внутри Docker Swarm (DNS по имени сервиса)
 */
@Injectable()
export class MessagingFactoryService extends BaseService {
  private static readonly DEFAULT_SERVICE_NAME = "service";
  private static readonly DEFAULT_RPC_PATH_PREFIX = "/rpc";

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

    const serviceName =
      serviceNode.data?.serviceName ||
      MessagingFactoryService.DEFAULT_SERVICE_NAME;

    this.logger.log(
      `Creating messaging components for service ${serviceNode.id} (${serviceName})`
    );

    try {
      // Генерируем HTTP RPC server код
      const serverCode = await this.generateHttpRpcServer(serviceName);

      // Проверяем, есть ли исходящие edges (сервис вызывает другие сервисы)
      const outgoingEdges =
        graph.edges?.filter((edge) => edge.source === serviceNode.id) || [];

      const hasOutgoingCalls = outgoingEdges.some(
        (edge) => edge.type === EdgeType.EDGE_TYPE_HTTP
      );

      let clientCode: string | undefined;
      if (hasOutgoingCalls) {
        // Генерируем HTTP RPC client код, если сервис вызывает другие сервисы
        clientCode = await this.generateHttpRpcClient(serviceName);
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
          },
        }
      ) as never;
    }
  }

  /**
   * Генерирует HTTP RPC server код
   */
  @CatchError({ operation: "generating HTTP RPC server code" })
  private async generateHttpRpcServer(serviceName: string): Promise<string> {
    const templatePath = `${TEMPLATE_PATHS.COMPONENTS}/http-rpc-server.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    const result = this.templateEngine.substituteVariables(template, {
      SERVICE_NAME: serviceName,
      RPC_PATH_PREFIX: MessagingFactoryService.DEFAULT_RPC_PATH_PREFIX,
    });

    return result.content;
  }

  /**
   * Генерирует HTTP RPC client код
   */
  @CatchError({ operation: "generating HTTP RPC client code" })
  private async generateHttpRpcClient(serviceName: string): Promise<string> {
    const templatePath = `${TEMPLATE_PATHS.COMPONENTS}/http-rpc-client.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    const result = this.templateEngine.substituteVariables(template, {
      SERVICE_NAME: serviceName,
      RPC_PATH_PREFIX: MessagingFactoryService.DEFAULT_RPC_PATH_PREFIX,
    });

    return result.content;
  }

  /**
   * Генерирует код для инициализации messaging в main.ts
   */
  @CatchError({ operation: "generating messaging initialization code" })
  generateMessagingInitializationCode(hasClient: boolean): string {
    // В main.ts у нас уже есть доступ к app (Elysia) — просто подключаем RPC роутер.
    let initCode = `// HTTP RPC (service-to-service inside Docker/Swarm)
const rpcServer = new HttpRpcServer({
  pathPrefix: "${MessagingFactoryService.DEFAULT_RPC_PATH_PREFIX}",
});
rpcServer.attach(app);`;

    if (hasClient) {
      initCode += `\n\n// HTTP RPC client factory (use service DNS names inside Docker/Swarm)
const rpcClient = new HttpRpcClient({
  pathPrefix: "${MessagingFactoryService.DEFAULT_RPC_PATH_PREFIX}",
});`;
    }

    return initCode;
  }
}
