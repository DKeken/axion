import {
  type DeployProjectRequest,
  type CancelDeploymentRequest,
  type GetDeploymentRequest,
  type ListDeploymentsRequest,
  type GetDeploymentStatusRequest,
  type RollbackDeploymentRequest,
} from "@axion/contracts";
import { Injectable } from "@nestjs/common";

import { DeploymentsService } from "@/deployment/services/deployments.service";

/**
 * Main DeploymentService - координатор, делегирует вызовы специализированным сервисам
 */
@Injectable()
export class DeploymentService {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  // Deployments
  async deployProject(data: DeployProjectRequest) {
    return this.deploymentsService.deployProject(data);
  }

  async cancelDeployment(data: CancelDeploymentRequest) {
    return this.deploymentsService.cancelDeployment(data);
  }

  async getDeployment(data: GetDeploymentRequest) {
    return this.deploymentsService.get(data);
  }

  async listDeployments(data: ListDeploymentsRequest) {
    return this.deploymentsService.list(data);
  }

  async getDeploymentStatus(data: GetDeploymentStatusRequest) {
    return this.deploymentsService.getStatus(data);
  }

  async rollbackDeployment(data: RollbackDeploymentRequest) {
    return this.deploymentsService.rollback(data);
  }
}
