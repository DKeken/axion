import { NodeType } from "@axion/contracts";
import type { Node } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import type { GraphFlowNodeData } from "@/utils/graph-converter";
import { getReactFlowNodeType } from "@/utils/graph-converter";

export class NodeFactory {
  static createNode(
    type: NodeType,
    position: { x: number; y: number } = { x: 0, y: 0 }
  ): Node<GraphFlowNodeData> {
    const id = uuidv4();
    const nodeTypeString = getReactFlowNodeType(type);
    const name = NodeFactory.getDefaultName(type);

    return {
      id,
      type: nodeTypeString,
      position,
      data: {
        id,
        name,
        type,
        blueprintId: "",
        config: {},
      },
    };
  }

  private static getDefaultName(type: NodeType): string {
    switch (type) {
      case NodeType.NODE_TYPE_DATABASE:
        return "New Database";
      case NodeType.NODE_TYPE_LOGIC:
        return "Logic Node";
      case NodeType.NODE_TYPE_GATEWAY:
        return "API Gateway";
      case NodeType.NODE_TYPE_SERVICE:
      default:
        return "New Service";
    }
  }
}
