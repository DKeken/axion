"use client";

import { useProjectGraph } from "./_hooks/use-project-graph";
import { GraphSidebar } from "./_components/graph-sidebar";
import { GraphEditor } from "./_components/graph-editor";
import { NodePropertiesSheet } from "@/components/graph-editor/node-properties-sheet";
import { ROUTES } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Code, Save, Play, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useParams } from "next/navigation";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    projectQuery,
    graphQuery,
    saveGraph,
    isSaving,
    generateProject,
    isGenerating,
    handleAddNode,
    handleNodeClick,
    handleNodeDelete,
    handleNodeUpdate,
  } = useProjectGraph(projectId);

  if (projectQuery.isLoading || graphQuery.isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projectQuery.isError || graphQuery.isError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">
            Не удалось загрузить проект
          </CardTitle>
          <CardDescription>Попробуйте обновить страницу.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!projectQuery.data?.project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Проект не найден</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center bg-card p-4 border-b shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            {projectQuery.data.project.name}
            <Badge variant="outline" className="font-mono font-normal text-xs">
              v{projectQuery.data.project.graphVersion}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Build workflow by dragging nodes from the sidebar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.DASHBOARD.PROJECTS.CODE(projectId)}>
              <Code className="h-4 w-4 mr-2" /> Code
            </Link>
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button
            onClick={saveGraph}
            disabled={isSaving}
            variant="secondary"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={generateProject}
            disabled={isGenerating}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <GraphSidebar />

        <div className="flex-1 relative bg-muted/5">
          <GraphEditor
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onDropNode={handleAddNode}
          />
        </div>
      </div>

      <NodePropertiesSheet
        open={!!selectedNodeId}
        onOpenChange={(open) => !open && setSelectedNodeId(null)}
        data={selectedNode ?? null}
        onSave={handleNodeUpdate}
        onDelete={handleNodeDelete}
      />
    </div>
  );
}
