import { type Edge, type Node, EdgeType, NodeType } from "@axion/contracts";

import { resolveConnectionName } from "@/deployment/generation/database-compose";

/**
 * Create nodeId -> serviceName map.
 */
export function buildNodeIdToServiceNameMap(
  serviceNodes: Node[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of serviceNodes) {
    const serviceName = node.data?.serviceName || node.id;
    map.set(node.id, serviceName);
  }
  return map;
}

/**
 * Resolve dependencies between services from edges.
 */
export function resolveServiceDependencies(
  edges: Edge[],
  nodeIdToServiceName: Map<string, string>
): {
  dependencies: Map<string, string[]>;
  serviceDependencies: string[];
} {
  const dependencies = new Map<string, string[]>();
  const serviceDependencies = new Set<string>();

  for (const edge of edges) {
    if (edge.type === EdgeType.EDGE_TYPE_UNSPECIFIED) continue;

    const sourceService = nodeIdToServiceName.get(edge.source);
    const targetService = nodeIdToServiceName.get(edge.target);

    if (!sourceService || !targetService) continue;

    if (!dependencies.has(targetService)) {
      dependencies.set(targetService, []);
    }

    dependencies.get(targetService)?.push(sourceService);
    serviceDependencies.add(sourceService);
    serviceDependencies.add(targetService);
  }

  return { dependencies, serviceDependencies: Array.from(serviceDependencies) };
}

/**
 * Resolve database dependencies for a service node.
 */
export function resolveDatabaseDependencies(
  nodeId: string,
  edges: Edge[],
  databaseNodes: Node[]
): string[] {
  const dbDependencies: string[] = [];

  for (const edge of edges) {
    if (edge.source === nodeId && edge.type === EdgeType.EDGE_TYPE_DATABASE) {
      const dbNode = databaseNodes.find((n) => n.id === edge.target);
      if (dbNode) {
        dbDependencies.push(resolveConnectionName(dbNode));
      }
    }
  }

  return dbDependencies;
}

/**
 * Filter nodes by type.
 */
export function filterNodesByType(nodes: Node[]): {
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
