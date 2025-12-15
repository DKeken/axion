import { type Edge, type Node, EdgeType, NodeType } from "@axion/contracts";
import { Injectable } from "@nestjs/common";

/**
 * Dependency Resolver Service
 * Разрешает зависимости между сервисами и базами данных из графа
 */
@Injectable()
export class DependencyResolverService {
  /**
   * Создает мапу nodeId -> serviceName для быстрого поиска
   */
  buildNodeIdToServiceNameMap(serviceNodes: Node[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const node of serviceNodes) {
      const serviceName = node.data?.serviceName || node.id;
      map.set(node.id, serviceName);
    }
    return map;
  }

  /**
   * Разрешает зависимости между сервисами из edges
   */
  resolveServiceDependencies(
    edges: Edge[],
    nodeIdToServiceName: Map<string, string>
  ): {
    dependencies: Map<string, string[]>;
    serviceDependencies: string[];
  } {
    const dependencies = new Map<string, string[]>();
    const serviceDependencies: string[] = [];

    for (const edge of edges) {
      if (edge.type === EdgeType.EDGE_TYPE_UNSPECIFIED) continue;

      const sourceService = nodeIdToServiceName.get(edge.source);
      const targetService = nodeIdToServiceName.get(edge.target);

      if (!sourceService || !targetService) continue;

      if (!dependencies.has(targetService)) {
        dependencies.set(targetService, []);
      }

      const deps = dependencies.get(targetService);
      if (deps) deps.push(sourceService);

      if (!serviceDependencies.includes(sourceService)) {
        serviceDependencies.push(sourceService);
      }
      if (!serviceDependencies.includes(targetService)) {
        serviceDependencies.push(targetService);
      }
    }

    return { dependencies, serviceDependencies };
  }

  /**
   * Находит связанные базы данных для сервиса через edges
   */
  resolveDatabaseDependencies(
    nodeId: string,
    edges: Edge[],
    databaseNodes: Node[]
  ): string[] {
    const dbDependencies: string[] = [];

    for (const edge of edges) {
      if (edge.source === nodeId && edge.type === EdgeType.EDGE_TYPE_DATABASE) {
        const dbNode = databaseNodes.find((n) => n.id === edge.target);
        if (dbNode) {
          const dbName =
            dbNode.data?.config?.["connectionName"] ||
            `db-${dbNode.id.slice(0, 8)}`;
          dbDependencies.push(dbName);
        }
      }
    }

    return dbDependencies;
  }

  /**
   * Фильтрует nodes по типам
   */
  filterNodesByType(nodes: Node[]): {
    serviceNodes: Node[];
    databaseNodes: Node[];
  } {
    const serviceNodes = nodes.filter(
      (node) => node.type === NodeType.NODE_TYPE_SERVICE
    );
    const databaseNodes = nodes.filter(
      (node) => node.type === NodeType.NODE_TYPE_DATABASE
    );
    return { serviceNodes, databaseNodes };
  }
}
