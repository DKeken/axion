import {
  createFullPagination,
  createClusterResponse,
  createListClustersResponse,
  createListServersResponse,
  type CreateClusterRequest,
  type DeleteClusterRequest,
  type GetClusterRequest,
  type ListClustersRequest,
  type UpdateClusterRequest,
  type ListClusterServersRequest,
} from "@axion/contracts";
import { CatchError } from "@axion/nestjs-common";
import { BaseService } from "@axion/shared";
import { Injectable } from "@nestjs/common";

import { verifyClusterAccess } from "@/infrastructure/helpers/cluster-access.helper";
import {
  transformClusterToContract,
  transformServerToContract,
} from "@/infrastructure/helpers/type-transformers";
import { ClusterRepository } from "@/infrastructure/repositories/cluster.repository";
import { ServerRepository } from "@/infrastructure/repositories/server.repository";

@Injectable()
export class ClustersService extends BaseService {
  constructor(
    private readonly clusterRepository: ClusterRepository,
    private readonly serverRepository: ServerRepository
  ) {
    super(ClustersService.name);
  }

  @CatchError({ operation: "creating cluster" })
  async create(data: CreateClusterRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    if (!data.name) {
      return this.createValidationResponse("name is required");
    }

    const cluster = await this.clusterRepository.create({
      userId: metadataCheck.userId,
      name: data.name,
      description: data.description || null,
    });

    const serversCount = await this.clusterRepository.getServersCount(
      cluster.id
    );

    return createClusterResponse(
      transformClusterToContract(cluster, serversCount)
    );
  }

  @CatchError({ operation: "getting cluster" })
  async get(data: GetClusterRequest) {
    const access = await verifyClusterAccess(
      this.clusterRepository,
      data.clusterId,
      data.metadata
    );
    if (!access.success) return access.response;

    const cluster = await this.clusterRepository.findById(data.clusterId);
    if (!cluster) {
      return this.createNotFoundResponse("Cluster", data.clusterId);
    }

    const serversCount = await this.clusterRepository.getServersCount(
      cluster.id
    );

    return createClusterResponse(
      transformClusterToContract(cluster, serversCount)
    );
  }

  @CatchError({ operation: "updating cluster" })
  async update(data: UpdateClusterRequest) {
    const access = await verifyClusterAccess(
      this.clusterRepository,
      data.clusterId,
      data.metadata
    );
    if (!access.success) return access.response;

    const updated = await this.clusterRepository.update(data.clusterId, {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    });

    if (!updated) {
      return this.createNotFoundResponse("Cluster", data.clusterId);
    }

    const serversCount = await this.clusterRepository.getServersCount(
      updated.id
    );

    return createClusterResponse(
      transformClusterToContract(updated, serversCount)
    );
  }

  @CatchError({ operation: "deleting cluster" })
  async delete(data: DeleteClusterRequest) {
    const access = await verifyClusterAccess(
      this.clusterRepository,
      data.clusterId,
      data.metadata
    );
    if (!access.success) return access.response;

    const deleted = await this.clusterRepository.delete(data.clusterId);
    if (!deleted) {
      return this.createNotFoundResponse("Cluster", data.clusterId);
    }

    return { status: 1 }; // STATUS_SUCCESS
  }

  @CatchError({ operation: "listing clusters" })
  async list(data: ListClustersRequest) {
    const metadataCheck = this.validateMetadata(data.metadata);
    if (!metadataCheck.success) return metadataCheck.response;

    const { page, limit } = this.extractPagination(data.pagination);

    const result = await this.clusterRepository.findByUserId(
      metadataCheck.userId,
      page,
      limit
    );

    // Получаем количество серверов для каждого кластера
    const clustersWithCounts = await Promise.all(
      result.clusters.map(async (cluster) => {
        const serversCount = await this.clusterRepository.getServersCount(
          cluster.id
        );
        return transformClusterToContract(cluster, serversCount);
      })
    );

    return createListClustersResponse(
      clustersWithCounts,
      createFullPagination({ page, limit }, result.total)
    );
  }

  @CatchError({ operation: "listing cluster servers" })
  async listClusterServers(data: ListClusterServersRequest) {
    const access = await verifyClusterAccess(
      this.clusterRepository,
      data.clusterId,
      data.metadata
    );
    if (!access.success) return access.response;

    const { page, limit } = this.extractPagination(data.pagination);

    const result = await this.serverRepository.findByClusterId(
      data.clusterId,
      page,
      limit
    );

    return createListServersResponse(
      result.servers.map(transformServerToContract),
      createFullPagination({ page, limit }, result.total)
    );
  }
}
