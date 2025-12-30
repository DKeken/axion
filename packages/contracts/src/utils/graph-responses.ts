/**
 * Helper functions for creating Graph Service responses according to Protobuf contracts
 * These functions create responses with the correct structure matching the generated types
 */

import { Status } from "../../generated/common/common";
import type { Pagination } from "../../generated/common/common";
import type {
  GraphResponse,
  ListGraphVersionsResponse,
  ListGraphVersionsData,
  GraphVersion,
} from "../../generated/graph/graph";
import type {
  Project,
  ProjectResponse,
  ListProjectsResponse,
  ListProjectsData,
} from "../../generated/graph/projects";
import type {
  ServiceResponse,
  ListServicesResponse,
  ListServicesData,
  ProjectService,
} from "../../generated/graph/services";

/**
 * Create ProjectResponse with correct structure: { status, error?, project? }
 */
export function createProjectResponse(project?: Project): ProjectResponse {
  return {
    status: Status.STATUS_SUCCESS,
    project,
  };
}

/**
 * Create ListProjectsResponse with correct structure: { status, error?, data?: { projects, pagination } }
 */
export function createListProjectsResponse(
  projects: Project[],
  pagination?: Pagination
): ListProjectsResponse {
  const data: ListProjectsData = {
    projects,
    pagination,
  };
  return {
    status: Status.STATUS_SUCCESS,
    data,
  };
}

/**
 * Create GraphResponse with correct structure: { status, error?, graph? }
 */
export function createGraphResponse(
  graph?: import("../../generated/graph/graph").GraphData
): GraphResponse {
  return {
    status: Status.STATUS_SUCCESS,
    graph,
  };
}

/**
 * Create ListGraphVersionsResponse with correct structure: { status, error?, data?: { versions, pagination } }
 */
export function createListGraphVersionsResponse(
  versions: GraphVersion[],
  pagination?: Pagination
): ListGraphVersionsResponse {
  const data: ListGraphVersionsData = {
    versions,
    pagination,
  };
  return {
    status: Status.STATUS_SUCCESS,
    data,
  };
}

/**
 * Create ServiceResponse with correct structure: { status, error?, service? }
 */
export function createServiceResponse(
  service?: ProjectService
): ServiceResponse {
  return {
    status: Status.STATUS_SUCCESS,
    service,
  };
}

/**
 * Create ListServicesResponse with correct structure: { status, error?, data?: { services, pagination } }
 */
export function createListServicesResponse(
  services: ProjectService[],
  pagination?: Pagination
): ListServicesResponse {
  const data: ListServicesData = {
    services,
    pagination,
  };
  return {
    status: Status.STATUS_SUCCESS,
    data,
  };
}
