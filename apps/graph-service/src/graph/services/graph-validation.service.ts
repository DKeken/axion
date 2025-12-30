import {
  type ValidateGraphRequest,
  createSuccessResponse,
  type GraphData,
  NodeType,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GraphValidationService extends BaseService {
  constructor() {
    super(GraphValidationService.name);
  }

  /**
   * Validates graph structure (basic checks)
   */
  validateStructure(graphData: GraphData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
      errors.push("Graph must have nodes array");
    }

    if (!graphData.edges || !Array.isArray(graphData.edges)) {
      errors.push("Graph must have edges array");
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Full graph validation (structure + business rules)
   */
  @CatchError({ operation: "validating graph" })
  async validate(data: ValidateGraphRequest) {
    if (!data.graphData) {
      return createSuccessResponse({
        valid: false,
        errors: ["graphData is required"],
        warnings: [],
      });
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate nodes
    if (!data.graphData.nodes || data.graphData.nodes.length === 0) {
      errors.push("Graph must contain at least one node");
    }

    const nodeIds = new Set<string>();
    for (const node of data.graphData.nodes) {
      if (!node.id) {
        errors.push("Node must have an id");
      } else if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node id: ${node.id}`);
      } else {
        nodeIds.add(node.id);
      }

      if (
        node.type === undefined ||
        node.type === NodeType.NODE_TYPE_UNSPECIFIED
      ) {
        errors.push(`Node ${node.id} must have a valid type`);
      }
    }

    // Validate edges
    if (data.graphData.edges) {
      for (const edge of data.graphData.edges) {
        if (!edge.source || !edge.target) {
          errors.push("Edge must have source and target");
        } else if (!nodeIds.has(edge.source)) {
          errors.push(
            `Edge references non-existent source node: ${edge.source}`
          );
        } else if (!nodeIds.has(edge.target)) {
          errors.push(
            `Edge references non-existent target node: ${edge.target}`
          );
        }
      }
    }

    return createSuccessResponse({
      valid: errors.length === 0,
      errors,
      warnings,
    });
  }
}
