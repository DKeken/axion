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
import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Param,
  Query,
} from "@nestjs/common";

import { DeploymentService } from "@/deployment/deployment.service";

@Controller("api")
@UseGuards(HttpAuthGuard)
export class DeploymentHttpController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post("deployments")
  async createDeployment(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Body() body: Omit<DeployProjectRequest, "metadata">
  ) {
    const req: DeployProjectRequest = { metadata, ...body };
    return this.deploymentService.deployProject(req);
  }

  @Get("deployments/:deploymentId")
  async getDeployment(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("deploymentId") deploymentId: string
  ) {
    const req: GetDeploymentRequest = { metadata, deploymentId };
    return this.deploymentService.getDeployment(req);
  }

  @Get("deployments")
  async listDeployments(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Query()
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
    return this.deploymentService.listDeployments(req);
  }

  @Get("deployments/:deploymentId/status")
  async getDeploymentStatus(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("deploymentId") deploymentId: string
  ) {
    const req: GetDeploymentStatusRequest = { metadata, deploymentId };
    return this.deploymentService.getDeploymentStatus(req);
  }

  @Post("deployments/:deploymentId/cancel")
  async cancelDeployment(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("deploymentId") deploymentId: string,
    @Body()
    body: Omit<CancelDeploymentRequest, "metadata" | "deploymentId">
  ) {
    const req: CancelDeploymentRequest = { metadata, deploymentId, ...body };
    return this.deploymentService.cancelDeployment(req);
  }

  @Post("deployments/:deploymentId/rollback")
  async rollbackDeployment(
    @AxionRequestMetadata() metadata: RequestMetadata,
    @Param("deploymentId") deploymentId: string,
    @Body()
    body: Omit<RollbackDeploymentRequest, "metadata" | "deploymentId">
  ) {
    const req: RollbackDeploymentRequest = { metadata, deploymentId, ...body };
    return this.deploymentService.rollbackDeployment(req);
  }
}
