import {
  DEPLOYMENT_SERVICE_PATTERNS,
  type DeployProjectRequest,
  type CancelDeploymentRequest,
  type GetDeploymentRequest,
  type ListDeploymentsRequest,
  type GetDeploymentStatusRequest,
  type RollbackDeploymentRequest,
} from "@axion/contracts";
import {
  MessagePatternWithLog,
  MicroserviceAuthGuard,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { DeploymentService } from "@/deployment/deployment.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.DEPLOY_PROJECT)
  async deployProject(@Payload() data: DeployProjectRequest) {
    return this.deploymentService.deployProject(data);
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.CANCEL_DEPLOYMENT)
  async cancelDeployment(@Payload() data: CancelDeploymentRequest) {
    return this.deploymentService.cancelDeployment(data);
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.GET_DEPLOYMENT)
  async getDeployment(@Payload() data: GetDeploymentRequest) {
    return this.deploymentService.getDeployment(data);
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.LIST_DEPLOYMENTS)
  async listDeployments(@Payload() data: ListDeploymentsRequest) {
    return this.deploymentService.listDeployments(data);
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.GET_DEPLOYMENT_STATUS)
  async getDeploymentStatus(@Payload() data: GetDeploymentStatusRequest) {
    return this.deploymentService.getDeploymentStatus(data);
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.ROLLBACK_DEPLOYMENT)
  async rollbackDeployment(@Payload() data: RollbackDeploymentRequest) {
    return this.deploymentService.rollbackDeployment(data);
  }
}
