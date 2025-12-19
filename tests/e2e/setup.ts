/**
 * E2E Test Setup
 * Common utilities and setup for end-to-end tests
 */

import { beforeAll, afterAll } from "bun:test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:8080";
const API_BASE = `${BASE_URL}/api/v1`;

export const e2eConfig = {
  baseUrl: BASE_URL,
  apiBase: API_BASE,
  timeout: 30000, // 30 seconds
  retries: 3,
};

/**
 * Wait for service to be ready
 */
export async function waitForService(
  url: string,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${url}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }

    if (i < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `Service at ${url} did not become ready within ${maxAttempts * delayMs}ms`
  );
}

/**
 * Setup before all tests
 */
export async function setupE2E(): Promise<void> {
  console.log("Setting up E2E tests...");

  // Wait for services to be ready
  const services = [
    `${e2eConfig.baseUrl.replace("/api/v1/graph", "")}/health`,
    `${e2eConfig.baseUrl.replace("/api/v1/codegen", "")}/health`,
    `${e2eConfig.baseUrl.replace("/api/v1/deployment", "")}/health`,
    `${e2eConfig.baseUrl.replace("/api/v1/infrastructure", "")}/health`,
  ];

  // Extract base URLs (remove duplicates)
  const baseUrls = [...new Set(services.map((s) => s.replace("/health", "")))];

  for (const baseUrl of baseUrls) {
    try {
      await waitForService(baseUrl);
      console.log(`✓ Service ready: ${baseUrl}`);
    } catch (error) {
      console.warn(`⚠ Service may not be ready: ${baseUrl}`, error);
    }
  }

  console.log("E2E setup complete");
}

/**
 * Cleanup after all tests
 */
export async function cleanupE2E(): Promise<void> {
  console.log("Cleaning up E2E tests...");
  // Add any cleanup logic here if needed
}

/**
 * Create test user session
 * Note: This assumes Better Auth is set up
 * In real tests, you'd authenticate and get a session token
 */
export async function createTestSession(): Promise<string> {
  // For now, return a placeholder token
  // In real implementation, this would authenticate with Better Auth
  const testUserId = `test-user-${Date.now()}`;

  // TODO: Implement actual authentication flow
  // This is a placeholder for the session token
  return `test-session-${testUserId}`;
}

/**
 * Make authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; status: number; headers: Headers }> {
  const sessionToken = await createTestSession();

  const response = await fetch(`${e2eConfig.apiBase}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  const data = (await response.json()) as T;

  return {
    data,
    status: response.status,
    headers: response.headers,
  };
}
