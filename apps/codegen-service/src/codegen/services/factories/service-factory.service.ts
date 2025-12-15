import { type GraphData, type Node, NodeType } from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, handleServiceError } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { TEMPLATE_PATHS } from "@/codegen/constants/template-engine.constants";
import { DatabaseFactoryService } from "@/codegen/services/factories/database-factory.service";
import { MessagingFactoryService } from "@/codegen/services/factories/messaging-factory.service";
import { TemplateEngineService } from "@/codegen/services/template-engine.service";
import type { ServiceComponents } from "@/codegen/types/factory.types";

/**
 * Service Factory Service
 * Главная фабрика, которая координирует создание всех компонентов сервиса
 * Использует DatabaseFactory и MessagingFactory для автоматической генерации
 */
@Injectable()
export class ServiceFactoryService extends BaseService {
  private static readonly DEFAULT_SERVICE_NAME = "service";
  private static readonly DEFAULT_HEALTH_CHECKS = "database, rabbitmq";

  constructor(
    private readonly templateEngine: TemplateEngineService,
    private readonly databaseFactory: DatabaseFactoryService,
    private readonly messagingFactory: MessagingFactoryService
  ) {
    super(ServiceFactoryService.name);
  }

  /**
   * Создает все компоненты для сервиса из графа
   * @param serviceNode - service node из графа
   * @param graph - полный граф проекта
   * @returns объект со всеми сгенерированными компонентами
   */
  @CatchError({ operation: "creating service components" })
  async createServiceComponents(
    serviceNode: Node,
    graph: GraphData
  ): Promise<ServiceComponents> {
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
      ServiceFactoryService.DEFAULT_SERVICE_NAME;

    this.logger.log(
      `Creating all components for service ${serviceNode.id} (${serviceName})`
    );

    try {
      // Создаем все компоненты параллельно
      const [
        databaseComponents,
        messagingComponents,
        mainCode,
        appModuleCode,
        healthCode,
      ] = await Promise.all([
        this.databaseFactory.createDatabaseComponents(serviceNode, graph),
        this.messagingFactory.createMessagingComponents(serviceNode, graph),
        this.generateMainEntry(serviceNode, graph),
        this.generateAppModule(serviceNode, graph),
        this.generateHealthCheck(serviceNode),
      ]);

      return {
        main: mainCode,
        appModule: appModuleCode,
        database: databaseComponents,
        messaging: messagingComponents,
        health: healthCode,
      };
    } catch (error) {
      return handleServiceError(
        this.logger,
        "creating service components",
        error,
        {
          operation: "creating service components",
          additional: {
            nodeId: serviceNode.id,
            serviceName,
          },
        }
      ) as never;
    }
  }

  /**
   * Генерирует main.ts entry point
   */
  @CatchError({ operation: "generating main entry code" })
  private async generateMainEntry(
    serviceNode: Node,
    graph: GraphData
  ): Promise<string> {
    const templatePath = `${TEMPLATE_PATHS.COMPONENTS}/main-entry.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    const serviceName =
      serviceNode.data?.serviceName ||
      ServiceFactoryService.DEFAULT_SERVICE_NAME;
    const serviceNamePascal = this.toPascalCase(serviceName);

    // Генерируем код инициализации database и messaging
    const databaseComponents =
      await this.databaseFactory.createDatabaseComponents(serviceNode, graph);
    const databaseInit =
      await this.databaseFactory.generateDatabaseInitializationCode(
        databaseComponents.connections
      );

    const messagingComponents =
      await this.messagingFactory.createMessagingComponents(serviceNode, graph);
    const messagingInit =
      await this.messagingFactory.generateMessagingInitializationCode(
        messagingComponents.server,
        messagingComponents.client
      );

    const result = this.templateEngine.substituteVariables(template, {
      SERVICE_NAME: serviceName,
      SERVICE_NAME_PASCAL: serviceNamePascal,
      IMPORTS: `import { ${serviceNamePascal}Module } from './modules/${serviceName}/${serviceName}.module';`,
      SERVICES_INIT: `${databaseInit}\n\n${messagingInit}`,
      HANDLERS_REGISTRATION: `// Register handlers for ${serviceName}`,
    });

    return result.content;
  }

  /**
   * Генерирует app.module.ts
   */
  @CatchError({ operation: "generating app module code" })
  private async generateAppModule(
    serviceNode: Node,
    _graph: GraphData
  ): Promise<string> {
    const serviceName =
      serviceNode.data?.serviceName ||
      ServiceFactoryService.DEFAULT_SERVICE_NAME;
    const serviceNamePascal = this.toPascalCase(serviceName);

    // Базовый шаблон app.module.ts
    return `import { Module } from '@nestjs/common';
import { ${serviceNamePascal}Module } from './modules/${serviceName}/${serviceName}.module';

@Module({
  imports: [
    ${serviceNamePascal}Module,
  ],
})
export class AppModule {}
`;
  }

  /**
   * Генерирует health check код
   */
  @CatchError({ operation: "generating health check code" })
  private async generateHealthCheck(serviceNode: Node): Promise<string> {
    const templatePath = `${TEMPLATE_PATHS.COMPONENTS}/health-check.mdx`;
    const template = await this.templateEngine.loadTemplate(templatePath);

    const serviceName =
      serviceNode.data?.serviceName ||
      ServiceFactoryService.DEFAULT_SERVICE_NAME;

    const result = this.templateEngine.substituteVariables(template, {
      SERVICE_NAME: serviceName,
      CHECKS: ServiceFactoryService.DEFAULT_HEALTH_CHECKS,
    });

    return result.content;
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
}
