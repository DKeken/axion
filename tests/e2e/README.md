# E2E Tests

End-to-end tests for Axion Stack happy path workflows.

## Structure

```
tests/e2e/
├── setup.ts              # Common setup and utilities
├── happy-path.test.ts    # Complete workflow: Project → Graph → Generate → Deploy → Rollback
├── sse.test.ts           # Server-Sent Events progress streaming
└── README.md             # This file
```

## Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with watch mode
bun run test:e2e:watch

# Run specific test file
bun test tests/e2e/happy-path.test.ts
```

## Prerequisites

1. **Services must be running**: All services (graph, codegen, deployment, infrastructure) must be running and accessible
2. **Traefik must be running**: Tests connect through Traefik at `http://localhost:8080`
3. **Database and infrastructure**: PostgreSQL, Kafka, Redis must be available

## Environment Variables

- `E2E_BASE_URL`: Base URL for API (default: `http://localhost:8080`)

## Test Workflows

### Happy Path

Tests the complete workflow:

1. Create Project
2. Update Graph
3. Generate Code
4. Wait for Generation and Validate
5. Create Deployment
6. Check Deployment Status
7. Rollback Deployment

### SSE Progress

Tests real-time progress updates via Server-Sent Events:

1. Graph status updates via SSE
2. Generation progress updates via SSE

## Notes

- Tests use placeholder authentication (TODO: implement real Better Auth flow)
- Some tests may be skipped if prerequisites are not met (e.g., no server available)
- Tests have extended timeouts for async operations (generation, deployment)
