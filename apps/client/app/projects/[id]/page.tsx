"use client";

import { useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
} from "reactflow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type GraphData,
  NodeType,
  EdgeType,
  type UpdateGraphRequest,
} from "@axion/contracts";
import { GraphEditor } from "@/components/graph-editor";
import { frontendApi } from "@/lib/frontend-api";
import {
  graphDataToFlow,
  type GraphFlowEdgeData,
  type GraphFlowNodeData,
} from "@/utils/graph-converter";
import { config } from "@/config/env";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function ProjectPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [nodes, setNodes, onNodesChange] = useNodesState<GraphFlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphFlowEdgeData>([]);

  const projectQuery = useQuery(frontendApi.queries.graph.project(projectId));
  const graphQuery = useQuery(frontendApi.queries.graph.graph(projectId));

  const saveGraph = useMutation({
    mutationFn: (payload: Pick<UpdateGraphRequest, "graphData">) =>
      frontendApi.graph.updateGraph(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: frontendApi.queries.graph.graph(projectId).queryKey,
      });
    },
  });

  const generateProject = useMutation({
    mutationFn: () =>
      frontendApi.codegen.generateProject(projectId, {
        forceRegenerate: false,
        aiModel: config.aiModel,
      }),
  });

  useEffect(() => {
    const graphData = graphQuery.data?.graph;
    if (graphData) {
      const { nodes: flowNodes, edges: flowEdges } = graphDataToFlow(graphData);
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [graphQuery.data?.graph, setNodes, setEdges]);

  const toGraphData = useCallback(
    (
      flowNodes: Node<GraphFlowNodeData>[],
      flowEdges: Edge<GraphFlowEdgeData>[]
    ): GraphData => ({
      nodes: flowNodes.map((node) => ({
        id: node.id,
        type:
          node.type === "database"
            ? NodeType.NODE_TYPE_DATABASE
            : NodeType.NODE_TYPE_SERVICE,
        data: {
          blueprintId: node.data.blueprintId,
          config: node.data.config ?? {},
          serviceName: node.data.name,
        },
        position: {
          x: node.position.x,
          y: node.position.y,
        },
      })),
      edges: flowEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.data?.edgeType ?? EdgeType.EDGE_TYPE_HTTP,
      })),
    }),
    []
  );

  const handleSave = useCallback(() => {
    const graphData = toGraphData(nodes, edges);
    saveGraph.mutate({ graphData });
  }, [edges, nodes, saveGraph, toGraphData]);

  const handleGenerate = useCallback(() => {
    generateProject.mutate();
  }, [generateProject]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => [
        ...eds,
        {
          id: `${connection.source}-${connection.target}`,
          source: connection.source!,
          target: connection.target!,
          type: "smoothstep",
          data: {
            edgeType: EdgeType.EDGE_TYPE_HTTP,
          },
        },
      ]);
    },
    [setEdges]
  );

  if (projectQuery.isLoading || graphQuery.isLoading) {
    return <div>Loading project...</div>;
  }

  if (projectQuery.isError || graphQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed to load project</CardTitle>
          <CardDescription>Try refreshing the page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!projectQuery.data?.project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project not found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {projectQuery.data.project.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Graph version: {projectQuery.data.project.graphVersion}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSave}
            disabled={saveGraph.isPending}
            variant="secondary"
          >
            {saveGraph.isPending ? "Saving..." : "Save graph"}
          </Button>
          <Button onClick={handleGenerate} disabled={generateProject.isPending}>
            {generateProject.isPending ? "Generating..." : "Generate code"}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <GraphEditor
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
        />
      </div>
    </div>
  );
}
