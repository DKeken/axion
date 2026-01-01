import { Controller, Logger } from "@nestjs/common";
import { InfrastructureService as InfrastructureServiceProto } from "@axion/contracts/generated/infrastructure/service_pb";
import type { ConnectRouter } from "@connectrpc/connect";
import { type ConnectRpcProvider, withValidation } from "@axion/nestjs-common";
import {
  type RegisterServerRequest,
  type GetServerRequest,
  type ListServersRequest,
  type UpdateServerStatusRequest,
  type DeleteServerRequest,
  type CreateClusterRequest,
  type GetClusterRequest,
  type ListClustersRequest,
  type UpdateClusterRequest,
  type DeleteClusterRequest,
  CreateClusterRequestSchema,
  CreateClusterResponseSchema,
  GetClusterRequestSchema,
  GetClusterResponseSchema,
  ListClustersRequestSchema,
  ListClustersResponseSchema,
  UpdateClusterRequestSchema,
  UpdateClusterResponseSchema,
  DeleteClusterRequestSchema,
  DeleteClusterResponseSchema,
  RegisterServerRequestSchema,
  RegisterServerResponseSchema,
  GetServerRequestSchema,
  GetServerResponseSchema,
  ListServersRequestSchema,
  ListServersResponseSchema,
  UpdateServerStatusRequestSchema,
  UpdateServerStatusResponseSchema,
  DeleteServerRequestSchema,
  DeleteServerResponseSchema,
  ConfigureServerRequestSchema,
  ConfigureServerResponseSchema,
  TestServerConnectionRequestSchema,
  TestServerConnectionResponseSchema,
  type ConfigureServerRequest,
  type TestServerConnectionRequest,
} from "@axion/contracts";
import { InfrastructureService } from "./infrastructure.service";

/**
 * Infrastructure Controller
 * Handles Connect-RPC requests for infrastructure management
 * Implements ConnectRpcProvider for automatic registration with bootstrap
 */
@Controller()
export class InfrastructureController implements ConnectRpcProvider {
  private readonly logger = new Logger(InfrastructureController.name);

  constructor(private readonly infrastructureService: InfrastructureService) {}

  /**
   * Create Connect-RPC router
   * This is used by the bootstrap helper to set up the Connect-RPC server
   */
  createRouter(): (router: ConnectRouter) => void {
    return (router: ConnectRouter) => {
      router.service(InfrastructureServiceProto, {
        // Cluster Operations
        createCluster: withValidation(
          CreateClusterRequestSchema,
          CreateClusterResponseSchema,
          async (req: CreateClusterRequest) => {
            this.logger.log("CreateCluster called");
            return this.infrastructureService.createCluster(req);
          }
        ),

        getCluster: withValidation(
          GetClusterRequestSchema,
          GetClusterResponseSchema,
          async (req: GetClusterRequest) => {
            this.logger.log(`GetCluster called: ${req.clusterId}`);
            return this.infrastructureService.getCluster(req);
          }
        ),

        listClusters: withValidation(
          ListClustersRequestSchema,
          ListClustersResponseSchema,
          async (req: ListClustersRequest) => {
            this.logger.log("ListClusters called");
            return this.infrastructureService.listClusters(req);
          }
        ),

        updateCluster: withValidation(
          UpdateClusterRequestSchema,
          UpdateClusterResponseSchema,
          async (req: UpdateClusterRequest) => {
            this.logger.log(`UpdateCluster called: ${req.clusterId}`);
            return this.infrastructureService.updateCluster(req);
          }
        ),

        deleteCluster: withValidation(
          DeleteClusterRequestSchema,
          DeleteClusterResponseSchema,
          async (req: DeleteClusterRequest) => {
            this.logger.log(`DeleteCluster called: ${req.clusterId}`);
            return this.infrastructureService.deleteCluster(req);
          }
        ),

        // Server Operations
        registerServer: withValidation(
          RegisterServerRequestSchema,
          RegisterServerResponseSchema,
          async (req: RegisterServerRequest) => {
            this.logger.log("RegisterServer called");
            return this.infrastructureService.registerServer(req);
          }
        ),

        getServer: withValidation(
          GetServerRequestSchema,
          GetServerResponseSchema,
          async (req: GetServerRequest) => {
            this.logger.log(`GetServer called: ${req.serverId}`);
            return this.infrastructureService.getServer(req);
          }
        ),

        listServers: withValidation(
          ListServersRequestSchema,
          ListServersResponseSchema,
          async (req: ListServersRequest) => {
            this.logger.log("ListServers called");
            return this.infrastructureService.listServers(req);
          }
        ),

        updateServerStatus: withValidation(
          UpdateServerStatusRequestSchema,
          UpdateServerStatusResponseSchema,
          async (req: UpdateServerStatusRequest) => {
            this.logger.log(`UpdateServerStatus called: ${req.serverId}`);
            return this.infrastructureService.updateServerStatus(req);
          }
        ),

        deleteServer: withValidation(
          DeleteServerRequestSchema,
          DeleteServerResponseSchema,
          async (req: DeleteServerRequest) => {
            this.logger.log(`DeleteServer called: ${req.serverId}`);
            return this.infrastructureService.deleteServer(req);
          }
        ),

        configureServer: withValidation(
          ConfigureServerRequestSchema,
          ConfigureServerResponseSchema,
          async (req: ConfigureServerRequest) => {
            this.logger.log(`ConfigureServer called: ${req.serverId}`);
            return this.infrastructureService.configureServer(req);
          }
        ),

        testServerConnection: withValidation(
          TestServerConnectionRequestSchema,
          TestServerConnectionResponseSchema,
          async (req: TestServerConnectionRequest) => {
            this.logger.log(`TestServerConnection called: ${req.hostname}`);
            return this.infrastructureService.testServerConnection(req);
          }
        ),
      });
    };
  }
}
