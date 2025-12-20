"use client";

import { useCallback } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { DatabaseNode } from "./database-node";
import { ServiceNode } from "./service-node";

const nodeTypes: NodeTypes = {
  database: DatabaseNode,
  service: ServiceNode,
};

export interface GraphEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
}

export function GraphEditor({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: GraphEditorProps) {
  const handleConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        onConnect(params);
      }
    },
    [onConnect]
  );

  return (
    <div className="w-full h-[600px] border border-border rounded-lg bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
