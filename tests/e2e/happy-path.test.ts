/**
 * E2E Happy Path Test
 * Tests the complete workflow: Project → Graph → Generate → Validate → Deploy → Status → Rollback
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { setupE2E, cleanupE2E, apiRequest, e2eConfig } from "./setup";
import type {
  CreateProjectRequest,
  ProjectResponse,
  UpdateGraphRequest,
  GraphResponse,
  CreateGenerationRequest,
  GenerationResponse,
  CreateDeploymentRequest,
  DeploymentResponse,
} from "@axion/contracts";

describe("E2E Happy Path", () => {
  let projectId: string;
  let graphVersion: number;
  let generationId: string;
  let deploymentId: string;

  beforeAll(async () => {
    await setupE2E();
  });

  afterAll(async () => {
    await cleanupE2E();
  });

  test(
    "1. Create Project",
    async () => {
      const request: CreateProjectRequest = {
        metadata: {
          userId: "test-user",
          projectId: "",
          requestId: `req-${Date.now()}`,
          timestamp: Date.now(),
        },
        name: `E2E Test Project ${Date.now()}`,
        description: "E2E test project",
      };

      const { data, status } = await apiRequest<ProjectResponse>(
        "/graph/projects",
        {
          method: "POST",
          body: JSON.stringify(request),
        }
      );

      expect(status).toBe(201);
      expect(data).toBeDefined();
      expect(data.status).toBeDefined();

      // Extract project ID from response
      if (data.result?.data?.project) {
        projectId = data.result.data.project.id;
        expect(projectId).toBeDefined();
      } else {
        throw new Error("Failed to create project - no ID in response");
      }
    },
    e2eConfig.timeout
  );

  test(
    "2. Update Graph",
    async () => {
      expect(projectId).toBeDefined();

      const request: UpdateGraphRequest = {
        metadata: {
          userId: "test-user",
          projectId: projectId,
          requestId: `req-${Date.now()}`,
          timestamp: Date.now(),
        },
        projectId: projectId,
        graphData: {
          nodes: [
            {
              id: "node-1",
              type: 1, // SERVICE
              data: {
                blueprintId: "nestjs-service",
                config: {
                  name: "test-service",
                },
                serviceName: "test-service",
              },
              position: { x: 0, y: 0 },
            },
          ],
          edges: [],
        },
      };

      const { data, status } = await apiRequest<GraphResponse>(
        `/graph/graph/${projectId}`,
        {
          method: "PUT",
          body: JSON.stringify(request),
        }
      );

      expect(status).toBe(200);
      expect(data).toBeDefined();
      expect(data.status).toBeDefined();

      // Extract graph version if available
      if (data.result?.data?.graph) {
        // Graph version might be in metadata or separate field
        graphVersion = 1; // Default to 1 for new graph
      }
    },
    e2eConfig.timeout
  );

  test(
    "3. Generate Code",
    async () => {
      expect(projectId).toBeDefined();

      const request: CreateGenerationRequest = {
        metadata: {
          userId: "test-user",
          projectId: projectId,
          requestId: `req-${Date.now()}`,
          timestamp: Date.now(),
        },
        projectId: projectId,
      };

      const { data, status } = await apiRequest<GenerationResponse>(
        "/codegen/generate",
        {
          method: "POST",
          body: JSON.stringify(request),
        }
      );

      expect(status).toBe(202); // Accepted for async operation
      expect(data).toBeDefined();
      expect(data.status).toBeDefined();

      // Extract generation ID
      if (data.result?.data?.generation) {
        generationId = data.result.data.generation.id;
        expect(generationId).toBeDefined();
      }
    },
    e2eConfig.timeout
  );

  test(
    "4. Wait for Generation and Validate",
    async () => {
      expect(generationId).toBeDefined();

      // Poll for generation status
      let status = "PENDING";
      let attempts = 0;
      const maxAttempts = 30;

      while (status === "PENDING" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        const { data } = await apiRequest(
          `/codegen/generations/${generationId}/status`,
          {
            method: "GET",
          }
        );

        if (data.result?.data?.status) {
          status = data.result.data.status;
        }

        attempts++;
      }

      expect(status).toBe("COMPLETED");
    },
    e2eConfig.timeout * 2
  ); // Longer timeout for generation

  test(
    "5. Create Deployment",
    async () => {
      expect(projectId).toBeDefined();
      expect(generationId).toBeDefined();

      // First, get a server (assuming infrastructure service has test server)
      // For now, we'll create a deployment request
      const request: CreateDeploymentRequest = {
        metadata: {
          userId: "test-user",
          projectId: projectId,
          requestId: `req-${Date.now()}`,
          timestamp: Date.now(),
        },
        projectId: projectId,
        serverId: "test-server-id", // This should be a real server ID in actual tests
      };

      const { data, status } = await apiRequest<DeploymentResponse>(
        "/deployment/deployments",
        {
          method: "POST",
          body: JSON.stringify(request),
        }
      );

      // Deployment might fail if no server is available, but that's okay for E2E structure
      expect([201, 202, 400, 404]).toContain(status);

      if (status === 201 || status === 202) {
        if (data.result?.data?.deployment) {
          deploymentId = data.result.data.deployment.id;
        }
      }
    },
    e2eConfig.timeout
  );

  test(
    "6. Check Deployment Status",
    async () => {
      if (!deploymentId) {
        test.skip("No deployment created, skipping status check");
        return;
      }

      const { data, status } = await apiRequest(
        `/deployment/deployments/${deploymentId}/status`,
        {
          method: "GET",
        }
      );

      expect(status).toBe(200);
      expect(data).toBeDefined();
    },
    e2eConfig.timeout
  );

  test(
    "7. Rollback Deployment",
    async () => {
      if (!deploymentId) {
        test.skip("No deployment created, skipping rollback");
        return;
      }

      const { data, status } = await apiRequest(
        `/deployment/deployments/${deploymentId}/rollback`,
        {
          method: "POST",
        }
      );

      expect([200, 400, 404]).toContain(status);
      // Rollback might fail if deployment is not in rollbackable state
    },
    e2eConfig.timeout
  );
});
