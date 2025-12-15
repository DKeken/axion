/**
 * Helper functions for creating Deployment Service responses according to Protobuf contracts
 * These functions create responses with the correct structure matching the generated types
 */

import { Status } from "../../generated/common/common";
import type {
  Deployment,
  DeployProjectResponse,
} from "../../generated/deployment/deployment";
import type {
  DeploymentResponse,
  ListDeploymentsResponse,
  ListDeploymentsData,
  DeploymentStatusResponse,
  DeploymentStatusData,
} from "../../generated/deployment/management";
import type { RollbackDeploymentResponse } from "../../generated/deployment/rollback";
import type { Pagination } from "../../generated/common/common";

/**
 * Create DeployProjectResponse with correct structure: { status, error?, deployment? }
 */
export function createDeployProjectResponse(
  deployment?: Deployment
): DeployProjectResponse {
  return {
    status: Status.STATUS_SUCCESS,
    deployment,
  };
}

/**
 * Create DeploymentResponse with correct structure: { status, error?, deployment? }
 */
export function createDeploymentResponse(
  deployment?: Deployment
): DeploymentResponse {
  return {
    status: Status.STATUS_SUCCESS,
    deployment,
  };
}

/**
 * Create ListDeploymentsResponse with correct structure: { status, error?, data?: { deployments, pagination } }
 */
export function createListDeploymentsResponse(
  deployments: Deployment[],
  pagination?: Pagination
): ListDeploymentsResponse {
  const data: ListDeploymentsData = {
    deployments,
    pagination: pagination || {
      page: 1,
      limit: 10,
      total: deployments.length,
      totalPages: 1,
    },
  };

  return {
    status: Status.STATUS_SUCCESS,
    data,
  };
}

/**
 * Create DeploymentStatusResponse with correct structure
 */
export function createDeploymentStatusResponse(
  data: DeploymentStatusData
): DeploymentStatusResponse {
  return {
    status: Status.STATUS_SUCCESS,
    data,
  };
}

/**
 * Create RollbackDeploymentResponse with correct structure
 */
export function createRollbackDeploymentResponse(
  deployment?: Deployment
): RollbackDeploymentResponse {
  return {
    status: Status.STATUS_SUCCESS,
    deployment,
  };
}
