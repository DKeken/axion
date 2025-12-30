import { useCallback, useEffect } from "react";
import { type Node } from "reactflow";
import {
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  NodeType,
  type UpdateGraphRequest,
  GraphResponse,
  ProjectResponse,
} from "@axion/contracts";
import { frontendApi } from "@/lib/frontend-api";
import { type GraphFlowNodeData } from "@/lib/graph/converter";
import { config } from "@/config/env";
import { toast } from "sonner";
import { useGraphStore } from "@/stores/graph-store";
import { useShallow } from "zustand/react/shallow";

export interface ProjectGraphHook {
  nodes: Node<GraphFlowNodeData>[];
  edges: import("reactflow").Edge<any>[];
  onNodesChange: import("reactflow").OnNodesChange;
  onEdgesChange: import("reactflow").OnEdgesChange;
  onConnect: import("reactflow").OnConnect;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedNode: GraphFlowNodeData | undefined;
  projectQuery: UseQueryResult<ProjectResponse, Error>;
  graphQuery: UseQueryResult<GraphResponse, Error>;
  saveGraph: () => void;
  isSaving: boolean;
  generateProject: () => void;
  isGenerating: boolean;
  handleAddNode: (type: NodeType, position?: { x: number; y: number }) => void;
  handleNodeClick: (event: React.MouseEvent, node: Node) => void;
  handleNodeDelete: () => void;
  handleNodeUpdate: (data: GraphFlowNodeData) => void;
}

export function useProjectGraph(projectId: string): ProjectGraphHook {
  const queryClient = useQueryClient();

  // Use shallow comparison to prevent unnecessary re-renders
  const {
    nodes,
    edges,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setGraphData,
    addNode,
    selectNode,
    updateNodeData,
    deleteNode,
    getGraphData,
    reset,
  } = useGraphStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      selectedNodeId: state.selectedNodeId,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      setGraphData: state.setGraphData,
      addNode: state.addNode,
      selectNode: state.selectNode,
      updateNodeData: state.updateNodeData,
      deleteNode: state.deleteNode,
      getGraphData: state.getGraphData,
      reset: state.reset,
    }))
  );

  const selectedNode = nodes.find((node) => node.id === selectedNodeId)?.data;

  // Queries
  const projectQuery = useQuery(frontendApi.queries.graph.project(projectId));
  const graphQuery = useQuery(frontendApi.queries.graph.graph(projectId));

  // Mutations
  const saveGraphMutation = useMutation({
    mutationFn: (payload: Pick<UpdateGraphRequest, "graphData">) =>
      frontendApi.graph.updateGraph(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: frontendApi.queries.graph.graph(projectId).queryKey,
      });
      toast.success("Graph saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save graph");
      console.error(error);
    },
  });

  const generateProjectMutation = useMutation({
    mutationFn: () =>
      frontendApi.codegen.generateProject(projectId, {
        forceRegenerate: false,
        aiModel: config.aiModel,
      }),
    onSuccess: () => {
      toast.success("Project generation started");
    },
    onError: (error) => {
      toast.error("Failed to start generation");
      console.error(error);
    },
  });

  // Reset store on unmount or projectId change
  useEffect(() => {
    return () => {
      reset();
    };
  }, [projectId, reset]);

  // Sync graph data from backend to store
  useEffect(() => {
    const graphData = graphQuery.data?.graph;
    if (graphData) {
      setGraphData(graphData);
    }
  }, [graphQuery.data?.graph, setGraphData]);

  // Handlers
  const handleSave = useCallback(() => {
    const graphData = getGraphData();
    saveGraphMutation.mutate({ graphData });
  }, [getGraphData, saveGraphMutation]);

  const handleGenerate = useCallback(() => {
    generateProjectMutation.mutate();
  }, [generateProjectMutation]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const handleNodeDelete = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  }, [selectedNodeId, deleteNode]);

  const handleNodeUpdate = useCallback(
    (data: GraphFlowNodeData) => {
      updateNodeData(data.id, data);
    },
    [updateNodeData]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNodeId,
    setSelectedNodeId: selectNode,
    selectedNode,
    projectQuery,
    graphQuery,
    saveGraph: handleSave,
    isSaving: saveGraphMutation.isPending,
    generateProject: handleGenerate,
    isGenerating: generateProjectMutation.isPending,
    handleAddNode: addNode,
    handleNodeClick,
    handleNodeDelete,
    handleNodeUpdate,
  };
}

