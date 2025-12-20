# @axion/frontend-api

Typed frontend HTTP client and TanStack Query integration for Axion Stack.

## Features

- ✅ **Type-safe HTTP client** based on [Ky](https://github.com/sindresorhus/ky) with automatic retry and error handling
- ✅ **SSE client** for real-time Server-Sent Events
- ✅ **TanStack Query integration** with query factories and best practices
- ✅ **Protobuf contract types** from `@axion/contracts`
- ✅ **Domain-specific APIs** (graph, codegen, deployment, infrastructure)
- ✅ **Automatic auth token injection** with refresh support
- ✅ **Enhanced error handling** with ApiError class
- ✅ **Query key factories** following TanStack Query best practices

## Installation

```bash
bun add @axion/frontend-api
```

## Quick Start

### 1. Create API Client

```tsx
import { createFrontendApi, createQueryClient } from "@axion/frontend-api";
import { QueryClientProvider } from "@tanstack/react-query";

// Create API client with config
const api = createFrontendApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  getAuthToken: async () => {
    // Your token retrieval logic
    return localStorage.getItem("auth_token");
  },
  onError: (error) => {
    console.error("API Error:", error);
  },
});

// Create QueryClient
const queryClient = createQueryClient({
  staleTimeMs: 30_000, // 30s
  retryQueries: 2,
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

### 2. Use in React Components

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@axion/frontend-api";

// Access the global api instance
import { api } from "@/lib/api";

function ProjectsList() {
  // Use query factory for type-safe queries
  const { data, isLoading, error } = useQuery(api.queries.graph.listProjects());

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data?.projects?.map((project) => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  );
}

function CreateProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      api.graph.createProject(data),
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({
        queryKey: queryKeys.graph.projects.all(),
      });
    },
  });

  return (
    <button
      onClick={() =>
        mutation.mutate({
          name: "New Project",
          description: "My project",
        })
      }
    >
      Create Project
    </button>
  );
}
```

### 3. SSE for Real-time Updates

```tsx
import { createSSEClient } from "@axion/frontend-api";
import { useEffect } from "react";

function DeploymentStatus({ deploymentId }: { deploymentId: string }) {
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    const sse = createSSEClient({
      url: `${process.env.NEXT_PUBLIC_API_URL}/api/deployments/${deploymentId}/stream`,
      getAuthToken: () => localStorage.getItem("auth_token"),
    });

    // Subscribe to status updates
    const unsubscribe = sse.on<{ status: string }>("status", (data) => {
      setStatus(data.status);
    });

    // Connect
    sse.connect();

    // Cleanup
    return () => {
      unsubscribe();
      sse.close();
    };
  }, [deploymentId]);

  return <div>Status: {status}</div>;
}
```

## API Reference

### `createFrontendApi(config?)`

Creates the main API client with all domain APIs.

**Config options:**

```typescript
{
  baseUrl?: string;              // API base URL
  getAuthToken?: () => Promise<string | null> | string | null;
  credentials?: RequestCredentials;  // 'include' | 'same-origin' | 'omit'
  headers?: Record<string, string>;
  retry?: {
    limit?: number;              // Max retry attempts (default: 2)
    statusCodes?: number[];      // Status codes to retry
    retryOnNetworkError?: boolean;
  };
  timeout?: number;              // Request timeout (default: 30000ms)
  onRetry?: (error: ApiError, retryCount: number) => void;
  onError?: (error: ApiError) => void;
}
```

**Returns:**

```typescript
{
  client: HttpClient;
  graph: GraphApi;
  codegen: CodegenApi;
  deployment: DeploymentApi;
  infrastructure: InfrastructureApi;
  queries: {
    graph: GraphQueries;
    codegen: CodegenQueries;
    deployment: DeploymentQueries;
    infrastructure: InfrastructureQueries;
  }
}
```

### Domain APIs

#### Graph API

```typescript
// Projects
api.graph.listProjects(params?, options?)
api.graph.getProject(projectId, options?)
api.graph.createProject(data, options?)
api.graph.updateProject(projectId, data, options?)
api.graph.deleteProject(projectId, options?)

// Graphs
api.graph.getGraph(projectId, options?)
api.graph.updateGraph(projectId, data, options?)
api.graph.listGraphVersions(projectId, options?)
api.graph.revertGraphVersion(projectId, data, options?)

// Services
api.graph.listServices(projectId, options?)
api.graph.getService(projectId, nodeId, options?)
```

#### Codegen API

```typescript
api.codegen.generateProject(projectId, data, options?)
api.codegen.generateService(projectId, nodeId, data, options?)
api.codegen.validateProject(projectId, data, options?)
api.codegen.validateService(projectId, nodeId, data, options?)
```

#### Deployment API

```typescript
api.deployment.deployProject(data, options?)
api.deployment.getDeployment(deploymentId, options?)
api.deployment.listDeployments(projectId, params?, options?)
api.deployment.getDeploymentStatus(deploymentId, options?)
api.deployment.rollbackDeployment(deploymentId, data, options?)
api.deployment.cancelDeployment(deploymentId, options?)
```

#### Infrastructure API

```typescript
// Servers
api.infrastructure.listServers(params?, options?)
api.infrastructure.getServer(serverId, options?)
api.infrastructure.createServer(data, options?)
api.infrastructure.updateServer(serverId, data, options?)
api.infrastructure.deleteServer(serverId, options?)
api.infrastructure.testServerConnection(data, options?)
api.infrastructure.configureServer(serverId, data, options?)

// Clusters
api.infrastructure.listClusters(params?, options?)
api.infrastructure.getCluster(clusterId, options?)
api.infrastructure.createCluster(data, options?)
api.infrastructure.updateCluster(clusterId, data, options?)
api.infrastructure.deleteCluster(clusterId, options?)
api.infrastructure.listClusterServers(clusterId, options?)

// Agents
api.infrastructure.installAgent(serverId, data, options?)
api.infrastructure.getAgentStatus(serverId, options?)

// System requirements
api.infrastructure.calculateSystemRequirements(data, options?)
```

### Query Keys

Hierarchical query keys for cache invalidation:

```typescript
import { queryKeys } from "@axion/frontend-api";

// Invalidate all graph queries
queryClient.invalidateQueries({ queryKey: queryKeys.graph.all() });

// Invalidate all projects
queryClient.invalidateQueries({ queryKey: queryKeys.graph.projects.all() });

// Invalidate specific project
queryClient.invalidateQueries({
  queryKey: queryKeys.graph.projects.detail(projectId),
});

// Invalidate all deployments
queryClient.invalidateQueries({ queryKey: queryKeys.deployment.all() });
```

### Error Handling

```typescript
import { ApiError } from "@axion/frontend-api";

try {
  const project = await api.graph.getProject("project-id");
} catch (error) {
  if (error instanceof ApiError) {
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    console.error("Request ID:", error.requestId);

    // Check error type
    if (error.is(404)) {
      console.error("Project not found");
    }

    if (error.isClientError()) {
      console.error("Client error (4xx)");
    }

    if (error.isServerError()) {
      console.error("Server error (5xx)");
    }

    // Get contract error details
    if (error.isContractError()) {
      const contractError = error.getContractError();
      console.error("Error code:", contractError?.code);
    }
  }
}
```

## Best Practices

### 1. Query Key Management

Use hierarchical query keys for efficient cache invalidation:

```typescript
// ✅ Good - Hierarchical keys
queryKeys.graph.projects.all(); // ['graph', 'projects']
queryKeys.graph.projects.list(params); // ['graph', 'projects', 'list', params]
queryKeys.graph.projects.detail(id); // ['graph', 'projects', 'detail', id]

// Invalidate all project-related queries
queryClient.invalidateQueries({
  queryKey: queryKeys.graph.projects.all(),
});
```

### 2. Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: (data) => api.graph.updateProject(projectId, data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: queryKeys.graph.projects.detail(projectId),
    });

    // Snapshot previous value
    const previous = queryClient.getQueryData(
      queryKeys.graph.projects.detail(projectId)
    );

    // Optimistically update
    queryClient.setQueryData(
      queryKeys.graph.projects.detail(projectId),
      (old) => ({ ...old, ...newData })
    );

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(
        queryKeys.graph.projects.detail(projectId),
        context.previous
      );
    }
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({
      queryKey: queryKeys.graph.projects.detail(projectId),
    });
  },
});
```

### 3. Custom Hooks

Create reusable query hooks:

```typescript
// hooks/use-projects.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProjects(params?: { page?: string; limit?: string }) {
  return useQuery(api.queries.graph.listProjects(params));
}

export function useProject(projectId: string) {
  return useQuery({
    ...api.queries.graph.project(projectId),
    enabled: !!projectId, // Only fetch if projectId is provided
  });
}
```

## Development

```bash
# Install dependencies
bun install

# Type check
bun run type-check

# Build
bun run build

# Clean
bun run clean
```

## License

MIT
