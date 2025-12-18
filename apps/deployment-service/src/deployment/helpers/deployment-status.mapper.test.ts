import assert from "node:assert/strict";
import test from "node:test";

import type { ServiceDeploymentStatus as RunnerServiceDeploymentStatus } from "@axion/contracts/generated/runner-agent/deployment";

import { mapRunnerServiceStatusesToDb } from "./deployment-status.mapper";

test("mapRunnerServiceStatusesToDb: returns empty array for undefined", () => {
  assert.deepEqual(mapRunnerServiceStatusesToDb(undefined), []);
});

test("mapRunnerServiceStatusesToDb: maps fields with safe fallbacks", () => {
  const input = [
    {
      serviceId: "svc-1",
      serviceName: "users",
      status: "DEPLOYMENT_STATUS_IN_PROGRESS",
      errorMessage: "",
      deployedAt: 123,
    },
    {
      serviceId: "",
      serviceName: "",
      status: undefined,
      errorMessage: undefined,
      deployedAt: undefined,
    },
  ] as unknown as RunnerServiceDeploymentStatus[];

  const out = mapRunnerServiceStatusesToDb(input);

  assert.deepEqual(out, [
    {
      serviceId: "svc-1",
      nodeId: "svc-1",
      serviceName: "users",
      serverId: "",
      errorMessage: "",
      deployedAt: 123,
      status: "DEPLOYMENT_STATUS_IN_PROGRESS",
    },
    {
      serviceId: "",
      nodeId: "",
      serviceName: "",
      serverId: "",
      errorMessage: "",
      deployedAt: 0,
      status: "unknown",
    },
  ]);
});
