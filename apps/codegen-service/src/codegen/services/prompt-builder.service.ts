import { type GraphData, type Node, NodeType } from "@axion/contracts";
import { Injectable } from "@nestjs/common";

/**
 * Service for building AI prompts for code generation
 * Converts graph data and node information into structured prompts for OpenRouter
 */
@Injectable()
export class PromptBuilderService {
  // Logger removed as it's not used yet

  /**
   * Build a system prompt that defines the AI's role and capabilities
   */
  buildSystemPrompt(): string {
    return `You are an expert NestJS microservice code generator for the Axion Stack platform.

Your task is to generate production-ready TypeScript code for microservices based on the service specifications provided.

**Architecture Guidelines:**
- Use NestJS framework with dependency injection
- Follow Repository pattern for database access
- Use Drizzle ORM for database operations
- Implement MessagePattern handlers for Kafka communication
- Use types from @axion/contracts package
- Follow strict error handling with @axion/shared utilities
- Use path aliases (@/) instead of relative imports
- All enum values must come from @axion/contracts

**Code Quality Requirements:**
- Type-safe TypeScript with explicit types
- Proper error handling with try-catch
- Comprehensive logging using NestJS Logger
- Follow Single Responsibility Principle
- Use dependency injection for all services
- Repository pattern for all database operations

**Response Format:**
Generate complete, working code files in JSON format with the following structure:
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "file content here"
    }
  ]
}

Always generate:
1. Main service file (service.service.ts)
2. Controller with MessagePattern handlers (service.controller.ts)
3. Module definition (service.module.ts)
4. Database schema (database/schema.ts)
5. Repository files (repositories/*.repository.ts)
6. Health check (health/health.controller.ts, health/health.module.ts)
7. Main entry point (main.ts)
8. App module (app.module.ts)
9. Database connection (database/connection.ts, database/index.ts)

Do not include:
- README files
- Documentation
- Test files
- Configuration files (tsconfig, package.json, etc.)

Generate only the source code files.`;
  }

  /**
   * Build a prompt for generating a complete service based on a node
   */
  buildServiceGenerationPrompt(
    node: Node,
    graph: GraphData,
    projectName: string
  ): string {
    const nodeData = node.data as Record<string, unknown> | undefined;
    const serviceName = (nodeData?.name as string) || "unknown-service";
    const serviceType = (nodeData?.type as string) || "generic";
    const dependencies = this.extractDependencies(node, graph);

    const prompt = `Generate a complete NestJS microservice with the following specifications:

**Project Context:**
- Project Name: ${projectName}
- Service Name: ${serviceName}
- Service Type: ${serviceType}

**Service Details:**
${this.formatNodeData(node)}

**Dependencies and Connected Services:**
${dependencies.length > 0 ? this.formatDependencies(dependencies) : "No external dependencies"}

**Requirements:**
1. Create a fully functional NestJS microservice
2. Implement Kafka message patterns for communication
3. Use Drizzle ORM with PostgreSQL
4. Include proper error handling and logging
5. Follow the Axion Stack architectural patterns
6. Use @axion/contracts for all types and constants
7. Implement health checks
8. Use Repository pattern for database access

**Technical Stack:**
- Framework: NestJS
- Database: PostgreSQL with Drizzle ORM
- Message Broker: Kafka (via NestJS microservices)
- Language: TypeScript with strict type checking

Generate the complete service code following the system guidelines.`;

    return prompt;
  }

  /**
   * Build a prompt for validating generated code
   */
  buildValidationPrompt(
    serviceName: string,
    generatedFiles: Array<{ path: string; content: string }>
  ): string {
    return `Validate the following generated code for the service "${serviceName}".

Check for:
1. **Structural Validation**: All required files present (module, controller, service, repositories, health, main, schema)
2. **Contract Compliance**: Proper use of types from @axion/contracts
3. **TypeScript Correctness**: No syntax errors, proper typing
4. **Build Readiness**: Code should compile without errors
5. **Health Check Implementation**: Proper health endpoint
6. **Contract Discovery**: Proper MessagePattern definitions

**Generated Files:**
${generatedFiles.map((f) => `- ${f.path}`).join("\n")}

**First File Content (sample):**
\`\`\`typescript
${generatedFiles[0]?.content.slice(0, 500)}...
\`\`\`

Provide a detailed validation report in JSON format:
{
  "structuralPassed": boolean,
  "contractPassed": boolean,
  "typescriptPassed": boolean,
  "buildPassed": boolean,
  "healthCheckPassed": boolean,
  "contractDiscoveryPassed": boolean,
  "errors": [
    {
      "level": "structural" | "contract" | "typescript" | "build" | "healthCheck" | "contractDiscovery",
      "message": "Error description",
      "file": "affected file path",
      "line": number (if applicable)
    }
  ],
  "warnings": [
    {
      "level": string,
      "message": string,
      "file": string
    }
  ]
}`;
  }

  /**
   * Build a prompt for contract discovery
   */
  buildContractDiscoveryPrompt(
    serviceName: string,
    generatedFiles: Array<{ path: string; content: string }>
  ): string {
    const controllerFiles = generatedFiles.filter(
      (f) => f.path.includes(".controller.ts") && !f.path.includes("health")
    );

    return `Discover and extract all Kafka MessagePattern contracts from the service "${serviceName}".

**Controller Files:**
${controllerFiles.map((f) => `
File: ${f.path}
\`\`\`typescript
${f.content}
\`\`\`
`).join("\n")}

Extract all MessagePattern definitions and provide them in JSON format:
{
  "contracts": [
    {
      "pattern": "service-name.method-name",
      "type": "request" | "event",
      "requestType": "TypeName from @axion/contracts",
      "responseType": "TypeName from @axion/contracts",
      "description": "What this pattern does"
    }
  ]
}

Focus on:
1. @MessagePattern decorators
2. @EventPattern decorators
3. Request/Response types
4. Pattern naming conventions`;
  }

  /**
   * Extract dependencies from graph edges
   */
  private extractDependencies(node: Node, graph: GraphData): Array<{
    targetNode: Node;
    edgeType: string;
  }> {
    if (!graph.edges) return [];

    const dependencies: Array<{ targetNode: Node; edgeType: string }> = [];

    for (const edge of graph.edges) {
      if (edge.source === node.id) {
        const targetNode = graph.nodes?.find((n) => n.id === edge.target);
        if (targetNode) {
          dependencies.push({
            targetNode,
            edgeType: String(edge.type || "unknown"),
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Format node data for prompt
   */
  private formatNodeData(node: Node): string {
    const data = node.data || {};
    let formatted = `- Node ID: ${node.id}\n`;
    formatted += `- Type: ${this.getNodeTypeName(node.type)}\n`;

    // Format all data fields
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        formatted += `- ${key}: ${JSON.stringify(value, null, 2)}\n`;
      }
    }

    return formatted;
  }

  /**
   * Format dependencies for prompt
   */
  private formatDependencies(
    dependencies: Array<{ targetNode: Node; edgeType: string }>
  ): string {
    return dependencies
      .map((dep) => {
        const nodeData = dep.targetNode.data as Record<string, unknown> | undefined;
        const targetName = (nodeData?.name as string) || dep.targetNode.id;
        const targetType = this.getNodeTypeName(dep.targetNode.type);
        return `- Depends on: ${targetName} (${targetType}) via ${dep.edgeType}`;
      })
      .join("\n");
  }

  /**
   * Get human-readable node type name
   */
  private getNodeTypeName(nodeType?: NodeType): string {
    if (!nodeType) return "unknown";

    switch (nodeType) {
      case NodeType.NODE_TYPE_SERVICE:
        return "Microservice";
      case NodeType.NODE_TYPE_DATABASE:
        return "Database";
      case NodeType.NODE_TYPE_GATEWAY:
        return "Gateway";
      default:
        return "unknown";
    }
  }
}

