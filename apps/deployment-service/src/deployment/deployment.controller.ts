import {
  DEPLOYMENT_SERVICE_PATTERNS,
  type CancelDeploymentRequest,
  type DeployProjectRequest,
  type GetDeploymentRequest,
  type GetDeploymentStatusRequest,
  type ListDeploymentsRequest,
  type RollbackDeploymentRequest,
} from "@axion/contracts";
import {
  DelegateToService,
  MessagePatternWithLog,
  MicroserviceAuthGuard,
} from "@axion/nestjs-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Payload } from "@nestjs/microservices";

import { DeploymentService } from "@/deployment/deployment.service";

@Controller()
@UseGuards(MicroserviceAuthGuard)
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {
    void this.deploymentService;
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.DEPLOY_PROJECT)
  @DelegateToService("deploymentService", "deployProject")
  async deployProject(@Payload() data: DeployProjectRequest) {
    return data;
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.CANCEL_DEPLOYMENT)
  @DelegateToService("deploymentService", "cancelDeployment")
  async cancelDeployment(@Payload() data: CancelDeploymentRequest) {
    return data;
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.GET_DEPLOYMENT)
  @DelegateToService("deploymentService", "getDeployment")
  async getDeployment(@Payload() data: GetDeploymentRequest) {
    return data;
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.LIST_DEPLOYMENTS)
  @DelegateToService("deploymentService", "listDeployments")
  async listDeployments(@Payload() data: ListDeploymentsRequest) {
    return data;
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.GET_DEPLOYMENT_STATUS)
  @DelegateToService("deploymentService", "getDeploymentStatus")
  async getDeploymentStatus(@Payload() data: GetDeploymentStatusRequest) {
    return data;
  }

  @MessagePatternWithLog(DEPLOYMENT_SERVICE_PATTERNS.ROLLBACK_DEPLOYMENT)
  @DelegateToService("deploymentService", "rollbackDeployment")
  async rollbackDeployment(@Payload() data: RollbackDeploymentRequest) {
    return data;
  }
}
