import type {
  CancelDeploymentRequest,
  DeployProjectRequest,
  GetDeploymentRequest,
  GetDeploymentStatusRequest,
  ListDeploymentsRequest,
  RequestMetadata,
  RollbackDeploymentRequest,
} from "@axion/contracts";
import { DeploymentStatus } from "@axion/contracts";
import {
  AxionRequestMetadata,
  HttpAuthGuard,
  normalizePagination,
  toNonNegativeIntOrUndefined,
  type PaginationQuery,
} from "@axion/nestjs-common";
import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, UseGuards } from "@nestjs/common";
import typia from "typia";

import { DeploymentService } from "@/deployment/deployment.service";

@Controller("api")
@UseGuards(HttpAuthGuard)
export class DeploymentHttpController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @TypedRoute.Post("deployments")
  async createDeployment(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedBody() body: Omit<DeployProjectRequest, "metadata">
  ) {
    const req: DeployProjectRequest = { metadata, ...body };
    return this.deploymentService.deployProject(
      typia.assert<DeployProjectRequest>(req)
    );
  }

  @TypedRoute.Get("deployments/:deploymentId")
  async getDeployment(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("deploymentId") deploymentId: string
  ) {
    const req: GetDeploymentRequest = { metadata, deploymentId };
    return this.deploymentService.getDeployment(
      typia.assert<GetDeploymentRequest>(req)
    );
  }

  @TypedRoute.Get("deployments")
  async listDeployments(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedQuery()
    query: {
      projectId: string;
      statusFilter?: string;
    } & PaginationQuery
  ) {
    const req: ListDeploymentsRequest = {
      metadata,
      projectId: query.projectId,
      pagination: normalizePagination(query),
      statusFilter:
        toNonNegativeIntOrUndefined(query.statusFilter) ??
        DeploymentStatus.DEPLOYMENT_STATUS_UNSPECIFIED,
    };
    return this.deploymentService.listDeployments(
      typia.assert<ListDeploymentsRequest>(req)
    );
  }

  @TypedRoute.Get("deployments/:deploymentId/status")
  async getDeploymentStatus(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("deploymentId") deploymentId: string
  ) {
    const req: GetDeploymentStatusRequest = { metadata, deploymentId };
    return this.deploymentService.getDeploymentStatus(
      typia.assert<GetDeploymentStatusRequest>(req)
    );
  }

  @TypedRoute.Post("deployments/:deploymentId/cancel")
  async cancelDeployment(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("deploymentId") deploymentId: string,
    @TypedBody()
    body: Omit<CancelDeploymentRequest, "metadata" | "deploymentId">
  ) {
    const req: CancelDeploymentRequest = { metadata, deploymentId, ...body };
    return this.deploymentService.cancelDeployment(
      typia.assert<CancelDeploymentRequest>(req)
    );
  }

  @TypedRoute.Post("deployments/:deploymentId/rollback")
  async rollbackDeployment(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @TypedParam("deploymentId") deploymentId: string,
    @TypedBody()
    body: Omit<RollbackDeploymentRequest, "metadata" | "deploymentId">
  ) {
    const req: RollbackDeploymentRequest = { metadata, deploymentId, ...body };
    return this.deploymentService.rollbackDeployment(
      typia.assert<RollbackDeploymentRequest>(req)
    );
  }
}
