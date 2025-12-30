"use client";

import { useCallback, useRef, useState } from "react";
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
  ReactFlowProvider,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { DatabaseNode, ServiceNode } from "@/components/graph-editor";
import { LogicNode } from "./node-types/logic-node";
import { NodeType } from "@axion/contracts";

const nodeTypes: NodeTypes = {
  database: DatabaseNode,
  service: ServiceNode,
  logic: LogicNode,
  // gateway: GatewayNode, // Add later if needed
};

export interface GraphEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onDropNode: (type: NodeType, position: { x: number; y: number }) => void;
}

function GraphEditorContent({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDropNode,
}: GraphEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const typeString = event.dataTransfer.getData("application/reactflow");

      if (
        typeof typeString === "undefined" ||
        !typeString ||
        !reactFlowInstance ||
        !reactFlowWrapper.current
      ) {
        return;
      }

      const type = Number(typeString) as NodeType;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      onDropNode(type, position);
    },
    [reactFlowInstance, onDropNode]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
        }}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            switch (n.type) {
              case "database":
                return "#2563eb";
              case "logic":
                return "#ea580c";
              default:
                return "#10b981";
            }
          }}
          className="bottom-8! right-8! border rounded-lg overflow-hidden shadow-lg"
        />
      </ReactFlow>
    </div>
  );
}

export function GraphEditor(props: GraphEditorProps) {
  return (
    <ReactFlowProvider>
      <GraphEditorContent {...props} />
    </ReactFlowProvider>
  );
}
