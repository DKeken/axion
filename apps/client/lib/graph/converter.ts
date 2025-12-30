import type { Node as FlowNode, Edge as FlowEdge } from "reactflow";
import { type GraphData, NodeType, EdgeType } from "@axion/contracts";

export type GraphFlowNodeData = {
  id: string;
  name: string;
  type: NodeType;
  blueprintId: string;
  config: Record<string, string>;
};

export type GraphFlowEdgeData = {
  edgeType: EdgeType;
};

export function getReactFlowNodeType(type: NodeType): string {
  switch (type) {
    case NodeType.NODE_TYPE_DATABASE:
      return "database";
    case NodeType.NODE_TYPE_LOGIC:
      return "logic";
    case NodeType.NODE_TYPE_GATEWAY:
      return "gateway";
    case NodeType.NODE_TYPE_SERVICE:
    default:
      return "service";
  }
}

export function getNodeTypeFromReactFlow(type?: string): NodeType {
  switch (type) {
    case "database":
      return NodeType.NODE_TYPE_DATABASE;
    case "logic":
      return NodeType.NODE_TYPE_LOGIC;
    case "gateway":
      return NodeType.NODE_TYPE_GATEWAY;
    case "service":
    default:
      return NodeType.NODE_TYPE_SERVICE;
  }
}

export function graphDataToFlow(graph: GraphData): {
  nodes: FlowNode<GraphFlowNodeData>[];
  edges: FlowEdge<GraphFlowEdgeData>[];
} {
  const nodes: FlowNode<GraphFlowNodeData>[] = graph.nodes.map(
    (node, index) => ({
      id: node.id,
      type: getReactFlowNodeType(node.type),
      position: node.position
        ? { x: node.position.x, y: node.position.y }
        : {
            x: (index % 4) * 250,
            y: Math.floor(index / 4) * 150,
          },
      data: {
        id: node.id,
        name: node.data?.serviceName ?? node.id,
        type: node.type,
        blueprintId: node.data?.blueprintId ?? "",
        config: node.data?.config ?? {},
      },
    })
  );

  const edges: FlowEdge<GraphFlowEdgeData>[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    data: {
      edgeType: edge.type,
    },
    animated: edge.type !== EdgeType.EDGE_TYPE_UNSPECIFIED,
  }));

  return { nodes, edges };
}

export function flowToGraphData(
  flowNodes: FlowNode<GraphFlowNodeData>[],
  flowEdges: FlowEdge<GraphFlowEdgeData>[]
): GraphData {
  return {
    nodes: flowNodes.map((node) => ({
      id: node.id,
      type: getNodeTypeFromReactFlow(node.type),
      data: {
        blueprintId: node.data.blueprintId,
        config: node.data.config ?? {},
        serviceName: node.data.name,
      },
      position: {
        x: node.position.x,
        y: node.position.y,
      },
    })),
    edges: flowEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.data?.edgeType ?? EdgeType.EDGE_TYPE_HTTP,
    })),
  };
}
