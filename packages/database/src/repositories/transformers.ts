/**
 * Automatic type transformers for database entities to Protobuf contracts
 * Zero manual mappings - direct type transformation
 */

import type {
  Project as ContractProject,
  ProjectService as ContractProjectService,
  GraphVersion as ContractGraphVersion,
  GraphData,
} from "@axion/contracts";
import { 
  ProjectSchema, 
  GraphVersionSchema, 
  ProjectServiceSchema,
  mapServiceStatus 
} from "@axion/contracts";
import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";

/**
 * Transform database Project to Contract Project type
 * Automatically converts Date -> Timestamp
 */
export function transformProjectToContract(project: {
  id: string;
  userId: string;
  name: string;
  graphVersion: number;
  infrastructureConfig?: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
}): ContractProject {
  return create(ProjectSchema, {
    id: project.id,
    userId: project.userId,
    name: project.name,
    graphVersion: project.graphVersion,
    infrastructureConfig: project.infrastructureConfig || {},
    createdAt: timestampFromDate(project.createdAt),
    updatedAt: timestampFromDate(project.updatedAt),
  });
}

/**
 * Transform database GraphVersion to Contract GraphVersion type
 */
export function transformGraphVersionToContract(version: {
  id: string;
  projectId: string;
  version: number;
  graphData?: GraphData | null;
  createdAt: Date;
}): ContractGraphVersion {
  return create(GraphVersionSchema, {
    id: version.id,
    projectId: version.projectId,
    version: version.version,
    graphData: version.graphData || undefined,
    createdAt: timestampFromDate(version.createdAt),
  });
}

/**
 * Transform database ProjectService to Contract ProjectService type
 * Automatically converts Date -> Timestamp and status string -> ServiceStatus enum
 */
export function transformProjectServiceToContract(service: {
  id: string;
  projectId: string;
  nodeId: string;
  serviceName: string;
  blueprintId: string;
  config?: Record<string, string> | null;
  status: string;
  codeVersion: number;
  generatedCodePath?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ContractProjectService {
  return create(ProjectServiceSchema, {
    id: service.id,
    projectId: service.projectId,
    nodeId: service.nodeId,
    serviceName: service.serviceName,
    blueprintId: service.blueprintId,
    config: service.config || {},
    status: mapServiceStatus(service.status),
    codeVersion: service.codeVersion,
    generatedCodePath: service.generatedCodePath || "",
    createdAt: timestampFromDate(service.createdAt),
    updatedAt: timestampFromDate(service.updatedAt),
  });
}
