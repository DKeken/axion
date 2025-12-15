import {
  type GenerationResult,
  type GraphData,
  GRAPH_SERVICE_NAME,
  GRAPH_SERVICE_PATTERNS,
  type GetGraphRequest,
  type GraphResponse,
} from "@axion/contracts";
import { BaseService, handleServiceError } from "@axion/shared";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import * as yaml from "js-yaml";
import { firstValueFrom } from "rxjs";

import {
  composeSpecSchema,
  type ComposeSpec,
} from "@/deployment/schemas/compose.schema";
import { DatabaseServiceGeneratorService } from "@/deployment/services/database-service-generator.service";
import { DependencyResolverService } from "@/deployment/services/dependency-resolver.service";
import { ServiceComposeGeneratorService } from "@/deployment/services/service-compose-generator.service";
import type { DockerComposeResult } from "@/deployment/services/types";

/**
 * Docker Stack Generation Service (Coordinator)
 * Координирует генерацию docker-compose.yml и Dockerfile
 * Делегирует работу специализированным сервисам
 */
@Injectable()
export class DockerStackGenerationService extends BaseService {
  constructor(
    private readonly dependencyResolver: DependencyResolverService,
    private readonly databaseServiceGenerator: DatabaseServiceGeneratorService,
    private readonly serviceComposeGenerator: ServiceComposeGeneratorService,
    @Optional()
    @Inject(GRAPH_SERVICE_NAME)
    private readonly graphClient: ClientProxy | null
  ) {
    super(DockerStackGenerationService.name);
  }

  /**
   * Генерирует Docker Compose файл на основе графа и сгенерированных сервисов
   */
  async generateDockerCompose(
    projectId: string,
    metadata: unknown,
    generationResults: GenerationResult[],
    envVars: Record<string, string> = {}
  ): Promise<DockerComposeResult> {
    const graph = await this.fetchGraph(projectId, metadata);

    const nodes = graph.nodes || [];
    const edges = graph.edges || [];

    // Фильтруем nodes по типам
    const { serviceNodes, databaseNodes } =
      this.dependencyResolver.filterNodesByType(nodes);

    if (serviceNodes.length === 0) {
      throw new Error("No service nodes found in graph");
    }

    if (!generationResults?.length) {
      throw new Error("No generation results provided for docker compose");
    }

    this.logger.log(
      `Generating Docker Compose for ${serviceNodes.length} services and ${databaseNodes.length} databases`
    );

    // Создаем мапу nodeId -> serviceName
    const nodeIdToServiceName =
      this.dependencyResolver.buildNodeIdToServiceNameMap(serviceNodes);

    // Разрешаем зависимости
    const { dependencies, serviceDependencies } =
      this.dependencyResolver.resolveServiceDependencies(
        edges,
        nodeIdToServiceName
      );

    // Генерируем docker-compose.yml
    const services: ComposeSpec["services"] = {};
    const networks: ComposeSpec["networks"] = { default: { driver: "bridge" } };
    const volumes: ComposeSpec["volumes"] = {};

    // Добавляем инфраструктурные сервисы (базы данных)
    for (const dbNode of databaseNodes) {
      const dbConfig = this.databaseServiceGenerator.generate(
        dbNode,
        projectId
      );
      if (dbConfig) {
        services[dbConfig.name] = dbConfig.service;
        if (dbConfig.volume) {
          volumes[dbConfig.volume] = {};
        }
      }
    }

    // Создаем сервисы для каждого сгенерированного сервиса
    for (const result of generationResults) {
      const nodeId = result.nodeId;
      const node = serviceNodes.find((n) => n.id === nodeId);
      if (!node) {
        this.logger.warn(
          `Node ${nodeId} not found in graph, skipping service ${result.serviceName}`
        );
        continue;
      }

      const serviceDeps = dependencies.get(result.serviceName) || [];
      const dbDependencies =
        this.dependencyResolver.resolveDatabaseDependencies(
          nodeId,
          edges,
          databaseNodes
        );

      const serviceConfig = this.serviceComposeGenerator.generateServiceConfig(
        result,
        projectId,
        envVars,
        serviceDeps,
        dbDependencies,
        databaseNodes
      );

      services[result.serviceName] = serviceConfig;
    }

    // Формируем финальный docker-compose
    const composeSpec = this.buildComposeSpec(services, networks, volumes);
    // Опциональная валидация структуры compose
    const parsedCompose = composeSpecSchema.parse(composeSpec);
    const dockerComposeYml = this.formatCompose(parsedCompose);

    return {
      dockerComposeYml,
      serviceDependencies: Array.from(
        new Set(
          serviceDependencies.length > 0
            ? serviceDependencies
            : Object.keys(services)
        )
      ),
    };
  }

  /**
   * Получает граф из Graph Service
   */
  private async fetchGraph(
    projectId: string,
    metadata: unknown
  ): Promise<GraphData> {
    if (!this.graphClient) {
      throw new Error("Graph service client not available");
    }

    let graphResponse: GraphResponse;
    try {
      graphResponse = await firstValueFrom(
        this.graphClient.send<GraphResponse>(GRAPH_SERVICE_PATTERNS.GET_GRAPH, {
          metadata,
          projectId,
        } as GetGraphRequest)
      );
    } catch (error) {
      throw handleServiceError(
        this.logger,
        "getting graph from graph-service",
        error
      );
    }

    if (graphResponse.error) {
      throw new Error(
        `Failed to get graph: ${graphResponse.error.message || "Unknown error"}`
      );
    }

    if (!graphResponse.graph) {
      throw new Error("Graph not found");
    }

    return graphResponse.graph;
  }

  /**
   * Формирует объект docker-compose
   */
  private buildComposeSpec(
    services: ComposeSpec["services"],
    networks: ComposeSpec["networks"],
    volumes: ComposeSpec["volumes"]
  ): ComposeSpec {
    return {
      version: "3.8",
      services,
      networks,
      volumes: volumes && Object.keys(volumes).length > 0 ? volumes : undefined,
    };
  }

  /**
   * Форматирует ComposeSpec в YAML строку используя js-yaml
   */
  private formatCompose(obj: ComposeSpec): string {
    try {
      return yaml.dump(obj, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });
    } catch (error) {
      this.logger.error("Failed to format Docker Compose as YAML", error);
      throw new Error(
        `Failed to format Docker Compose: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
