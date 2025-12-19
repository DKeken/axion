/**
 * E2E SSE (Server-Sent Events) Test
 * Tests real-time progress updates via SSE
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { setupE2E, cleanupE2E, apiRequest, e2eConfig } from "./setup";

describe("E2E SSE Progress", () => {
  let projectId: string;

  beforeAll(async () => {
    await setupE2E();
  });

  afterAll(async () => {
    await cleanupE2E();
  });

  test("SSE Graph Status Updates", async () => {
    // First create a project
    const createRequest = {
      metadata: {
        userId: "test-user",
        projectId: "",
        requestId: `req-${Date.now()}`,
        timestamp: Date.now(),
      },
      name: `SSE Test Project ${Date.now()}`,
      description: "SSE test project",
    };

    const { data: projectData } = await apiRequest(
      "/graph/projects",
      {
        method: "POST",
        body: JSON.stringify(createRequest),
      }
    );

    if (projectData.result?.data?.project) {
      projectId = projectData.result.data.project.id;
    } else {
      throw new Error("Failed to create project for SSE test");
    }

    // Connect to SSE endpoint
    const sseUrl = `${e2eConfig.apiBase}/graph/graph/${projectId}/status/stream`;
    
    // Create EventSource-like connection using fetch with stream
    const response = await fetch(sseUrl, {
      headers: {
        Accept: "text/event-stream",
        Cache-Control: "no-cache",
      },
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    // Read SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Failed to get stream reader");
    }

    let eventCount = 0;
    const maxEvents = 5;
    const timeout = 10000; // 10 seconds

    const timeoutId = setTimeout(() => {
      reader.cancel();
    }, timeout);

    try {
      while (eventCount < maxEvents) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove "data: " prefix
            try {
              const event = JSON.parse(data);
              expect(event).toBeDefined();
              eventCount++;
            } catch (e) {
              // Invalid JSON, skip
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
      reader.cancel();
    }

    expect(eventCount).toBeGreaterThan(0);
  }, e2eConfig.timeout * 2);

  test("SSE Generation Progress Updates", async () => {
    if (!projectId) {
      test.skip("No project created, skipping generation SSE test");
      return;
    }

    // Start generation
    const generateRequest = {
      metadata: {
        userId: "test-user",
        projectId: projectId,
        requestId: `req-${Date.now()}`,
        timestamp: Date.now(),
      },
      projectId: projectId,
    };

    const { data: genData } = await apiRequest(
      "/codegen/generate",
      {
        method: "POST",
        body: JSON.stringify(generateRequest),
      }
    );

    let generationId: string | undefined;
    if (genData.result?.data?.generation) {
      generationId = genData.result.data.generation.id;
    }

    if (!generationId) {
      test.skip("No generation started, skipping SSE test");
      return;
    }

    // Connect to generation SSE endpoint
    const sseUrl = `${e2eConfig.apiBase}/codegen/generations/${generationId}/progress/stream`;
    
    const response = await fetch(sseUrl, {
      headers: {
        Accept: "text/event-stream",
        Cache-Control: "no-cache",
      },
    });

    expect(response.ok).toBe(true);

    // Similar SSE reading logic as above
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Failed to get stream reader");
    }

    let eventCount = 0;
    const maxEvents = 3;

    try {
      while (eventCount < maxEvents) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data);
              expect(event).toBeDefined();
              expect(event.progress).toBeDefined();
              eventCount++;
            } catch (e) {
              // Invalid JSON, skip
            }
          }
        }
      }
    } finally {
      reader.cancel();
    }

    expect(eventCount).toBeGreaterThan(0);
  }, e2eConfig.timeout * 2);
});
