import {
  type GenerateProjectRequest,
  type GenerateServiceRequest,
  type GraphData,
  type Node,
  NodeType,
  ServiceStatus,
  GRAPH_SERVICE_NAME,
  GRAPH_SERVICE_PATTERNS,
} from "@axion/contracts";
import {
  createErrorResponse,
  createNotFoundError,
  createSuccessResponse,
  createValidationError,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService, handleServiceError } from "@axion/shared";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

import { type GenerationHistoryRepository } from "@/codegen/repositories/generation-history.repository";
import { ServiceFactoryService } from "@/codegen/services/factories/service-factory.service";
import { OpenRouterService } from "@/codegen/services/openrouter.service";
import { PromptBuilderService } from "@/codegen/services/prompt-builder.service";
import { ProtobufContractGeneratorService } from "@/codegen/services/protobuf-contract-generator.service";

/**
 * Generation Service
 * Координирует генерацию кода для проектов и сервисов
 * Использует Factory сервисы для базовых компонентов и LLM для бизнес-логики
 */
@Injectable()
export class GenerationService extends BaseService {
  constructor(
    private readonly generationHistoryRepository: GenerationHistoryRepository,
    private readonly openRouterService: OpenRouterService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly serviceFactory: ServiceFactoryService,
    private readonly protobufGenerator: ProtobufContractGeneratorService,
    @Optional()
    @Inject(GRAPH_SERVICE_NAME)
    private readonly graphClient: ClientProxy | null
  ) {
    super(GenerationService.name);
  }

  @CatchError({ operation: "generating project" })
  async generateProject(data: GenerateProjectRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    // Get graph from graph-service via Kafka
    if (!this.graphClient) {
      return createErrorResponse(
        createValidationError("Graph service client not available")
      );
    }

    let graphResponse;
    try {
      graphResponse = await firstValueFrom(
        this.graphClient.send(GRAPH_SERVICE_PATTERNS.GET_GRAPH, {
          metadata: data.metadata,
          projectId: data.projectId,
        })
      );
    } catch (error) {
      return handleServiceError(
        this.logger,
        "getting graph from graph-service",
        error
      );
    }

    if (graphResponse.error) {
      return createErrorResponse(graphResponse.error);
    }

    if (!graphResponse.graph) {
      return createErrorResponse(createNotFoundError("Graph", data.projectId));
    }

    const graph = graphResponse.graph;
    const projectName = this.extractProjectName(graph);

    // Генерируем Protobuf контракты для всего проекта
    const protobufContracts = await this.protobufGenerator.generateContracts(
      graph,
      projectName
    );

    const results = [];

    // Process each service node in the graph
    if (graph.nodes) {
      for (const node of graph.nodes) {
        if (node.type === NodeType.NODE_TYPE_SERVICE) {
          const result = await this.generateServiceFromNode(
            node,
            graph,
            data,
            projectName,
            protobufContracts
          );
          results.push(result);
        }
      }
    }

    const successful = results.filter(
      (r) => r.status === ServiceStatus.SERVICE_STATUS_VALIDATED
    ).length;
    const failed = results.filter(
      (r) => r.status === ServiceStatus.SERVICE_STATUS_ERROR
    ).length;

    return createSuccessResponse({
      results,
      totalServices: results.length,
      successful,
      failed,
    });
  }

  @CatchError({ operation: "generating service" })
  async generateService(data: GenerateServiceRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    if (!data.nodeId) {
      return createErrorResponse(createValidationError("nodeId is required"));
    }

    if (!this.graphClient) {
      return createErrorResponse(
        createValidationError("Graph service client not available")
      );
    }

    let graphResponse;
    try {
      graphResponse = await firstValueFrom(
        this.graphClient.send(GRAPH_SERVICE_PATTERNS.GET_GRAPH, {
          metadata: data.metadata,
          projectId: data.projectId,
        })
      );
    } catch (error) {
      return handleServiceError(
        this.logger,
        "getting graph from graph-service",
        error
      );
    }

    if (graphResponse.error) {
      return createErrorResponse(graphResponse.error);
    }

    if (!graphResponse.graph) {
      return createErrorResponse(createNotFoundError("Graph", data.projectId));
    }

    const graph = graphResponse.graph;
    const projectName = this.extractProjectName(graph);

    // Находим конкретный node
    const node = graph.nodes?.find((n: Node) => n.id === data.nodeId);
    if (!node || node.type !== NodeType.NODE_TYPE_SERVICE) {
      return createErrorResponse(
        createNotFoundError("Service node", data.nodeId)
      );
    }

    // Генерируем Protobuf контракты
    const protobufContracts = await this.protobufGenerator.generateContracts(
      graph,
      projectName
    );

    const result = await this.generateServiceFromNode(
      node,
      graph,
      data,
      projectName,
      protobufContracts
    );

    return createSuccessResponse(result);
  }

  /**
   * Генерирует код для одного сервиса из node
   */
  @CatchError({ operation: "generating service from node" })
  private async generateServiceFromNode(
    node: Node,
    graph: GraphData,
    request: GenerateProjectRequest | GenerateServiceRequest,
    projectName: string,
    protobufContracts: Map<string, string>
  ) {
    const serviceName = this.extractServiceName(node);

    // Проверяем историю генерации
    const latestHistory =
      await this.generationHistoryRepository.findLatestByService(
        request.projectId,
        node.id
      );

    if (!request.forceRegenerate && latestHistory) {
      return {
        serviceId: node.id,
        nodeId: node.id,
        serviceName,
        status: ServiceStatus.SERVICE_STATUS_VALIDATED,
        generatedCodePath: latestHistory.generatedCodePath || "",
        validationErrors: latestHistory.validationErrors || [],
        codeVersion: latestHistory.codeVersion,
      };
    }

    const codeVersion = latestHistory ? latestHistory.codeVersion + 1 : 1;

    // Сохраняем историю с pending статусом
    const history = await this.generationHistoryRepository.create({
      projectId: request.projectId,
      nodeId: node.id,
      serviceName,
      blueprintId: null,
      codeVersion,
      status: "pending",
    });

    try {
      // 1. Генерируем базовые компоненты через Factory
      this.logger.log(
        `Generating base components for service: ${serviceName} using Factory patterns`
      );

      const serviceComponents =
        await this.serviceFactory.createServiceComponents(node, graph);

      // 2. Генерируем бизнес-логику через LLM
      this.logger.log(
        `Generating business logic for service: ${serviceName} using LLM${request.aiModel ? ` (model: ${request.aiModel})` : ""}`
      );

      const systemPrompt = this.promptBuilderService.buildSystemPrompt();
      const userPrompt = this.promptBuilderService.buildServiceGenerationPrompt(
        node,
        graph,
        projectName
      );

      const aiResponse = await this.openRouterService.complete(userPrompt, {
        systemPrompt,
        temperature: 0.2,
        maxTokens: 16000,
        model: request.aiModel,
      });

      // 3. Парсим LLM ответ (только бизнес-логика)
      let businessLogicFiles: Array<{ path: string; content: string }> = [];
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*"files"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          businessLogicFiles = parsed.files || [];
        }
      } catch (parseError) {
        this.logger.error("Failed to parse AI response as JSON", parseError);
        throw new Error("Failed to parse AI response format");
      }

      // 4. Объединяем все файлы: базовые компоненты + бизнес-логика + protobuf
      const allFiles = this.combineGeneratedFiles(
        serviceComponents,
        businessLogicFiles,
        protobufContracts,
        serviceName
      );

      // 5. Сохраняем путь к сгенерированному коду
      const codePath = `/generated/${request.projectId}/${node.id}/v${codeVersion}`;

      // 6. Обновляем историю с успешным статусом
      await this.generationHistoryRepository.update(history.id, {
        status: "validated",
        generatedCodePath: codePath,
        validationErrors: [],
      });

      this.logger.log(
        `Code generation successful for ${serviceName} (${allFiles.length} total files: ${serviceComponents.database.connections.length} connections, ${businessLogicFiles.length} business logic files, ${protobufContracts.size} proto files)`
      );

      return {
        serviceId: node.id,
        nodeId: node.id,
        serviceName,
        status: ServiceStatus.SERVICE_STATUS_VALIDATED,
        generatedCodePath: codePath,
        validationErrors: [],
        codeVersion: history.codeVersion,
      };
    } catch (error) {
      this.logger.error(`Code generation failed for ${serviceName}`, error);

      await this.generationHistoryRepository.update(history.id, {
        status: "error",
        validationErrors: [
          {
            level: "generation",
            message: error instanceof Error ? error.message : "Unknown error",
            file: "",
          },
        ],
      });

      return {
        serviceId: node.id,
        nodeId: node.id,
        serviceName,
        status: ServiceStatus.SERVICE_STATUS_ERROR,
        generatedCodePath: "",
        validationErrors: [
          {
            level: "generation",
            message: error instanceof Error ? error.message : "Unknown error",
            file: "",
          },
        ],
        codeVersion: history.codeVersion,
      };
    }
  }

  /**
   * Объединяет все сгенерированные файлы
   */
  private combineGeneratedFiles(
    serviceComponents: {
      main: string;
      appModule: string;
      database: {
        connections: Array<{ connectionName: string; code: string }>;
        schemas: Array<{ entityName: string; code: string }>;
        repositories: Array<{ entityName: string; code: string }>;
      };
      messaging: {
        server: string;
        client?: string;
      };
      health: string;
    },
    businessLogicFiles: Array<{ path: string; content: string }>,
    protobufContracts: Map<string, string>,
    serviceName: string
  ): Array<{ path: string; content: string }> {
    const files: Array<{ path: string; content: string }> = [];

    // Добавляем базовые компоненты из Factory
    files.push({ path: "src/main.ts", content: serviceComponents.main });
    files.push({
      path: "src/app.module.ts",
      content: serviceComponents.appModule,
    });
    files.push({
      path: "src/health/health.controller.ts",
      content: serviceComponents.health,
    });

    // Добавляем database компоненты
    for (const connection of serviceComponents.database.connections) {
      files.push({
        path: `src/database/${connection.connectionName}/connection.ts`,
        content: connection.code,
      });
    }
    for (const schema of serviceComponents.database.schemas) {
      files.push({
        path: `src/database/${schema.entityName.toLowerCase()}/schema.ts`,
        content: schema.code,
      });
    }
    for (const repository of serviceComponents.database.repositories) {
      files.push({
        path: `src/database/${repository.entityName.toLowerCase()}/repository.ts`,
        content: repository.code,
      });
    }

    // Добавляем messaging компоненты
    files.push({
      path: "src/messaging/rabbitmq-server.ts",
      content: serviceComponents.messaging.server,
    });
    if (serviceComponents.messaging.client) {
      files.push({
        path: "src/messaging/rabbitmq-client.ts",
        content: serviceComponents.messaging.client,
      });
    }

    // Добавляем бизнес-логику от LLM
    files.push(...businessLogicFiles);

    // Добавляем Protobuf контракты
    const protoContent = protobufContracts.get(serviceName);
    if (protoContent) {
      files.push({
        path: `proto/${serviceName.toLowerCase()}.proto`,
        content: protoContent,
      });
    }

    return files;
  }

  /**
   * Извлекает имя проекта из графа
   */
  private extractProjectName(graph: GraphData): string {
    const projectNode = graph.nodes?.find(
      (n: Node) => n.type === NodeType.NODE_TYPE_SERVICE
    );
    return projectNode?.data?.serviceName || "unknown-project";
  }

  /**
   * Извлекает имя сервиса из node
   */
  private extractServiceName(node: Node): string {
    return node.data?.serviceName || `service-${node.id.slice(0, 8)}`;
  }
}
