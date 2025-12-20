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

export function graphDataToFlow(graph: GraphData): {
  nodes: FlowNode<GraphFlowNodeData>[];
  edges: FlowEdge<GraphFlowEdgeData>[];
} {
  const nodes: FlowNode<GraphFlowNodeData>[] = graph.nodes.map(
    (node, index) => ({
      // Graph contract marks `data` as required, but generated TS may allow undefined.
      // Fallbacks here are only for UI stability when data is missing.
      // (The backend should always persist valid nodes.)
      id: node.id,
      type: node.type === NodeType.NODE_TYPE_DATABASE ? "database" : "service",
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
