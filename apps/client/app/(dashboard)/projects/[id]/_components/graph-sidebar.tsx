"use client";

import { NodeType } from "@axion/contracts";
import { cn } from "@/lib/utils";
import { Database, Server, Workflow, Network } from "lucide-react";

export function GraphSidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType.toString());
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 border-r bg-muted/10 h-full flex flex-col">
      <div className="p-4 border-b bg-background">
        <h2 className="font-semibold text-sm">Nodes Library</h2>
        <p className="text-xs text-muted-foreground">
          Drag nodes to the canvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Core
          </h3>
          <div className="grid gap-2">
            <SidebarItem
              icon={Server}
              label="Service"
              description="Microservice backend"
              nodeType={NodeType.NODE_TYPE_SERVICE}
              onDragStart={onDragStart}
              color="text-primary"
              bg="bg-primary/10"
            />
            <SidebarItem
              icon={Database}
              label="Database"
              description="PostgreSQL, Redis..."
              nodeType={NodeType.NODE_TYPE_DATABASE}
              onDragStart={onDragStart}
              color="text-blue-600"
              bg="bg-blue-100"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Flow Control
          </h3>
          <div className="grid gap-2">
            <SidebarItem
              icon={Network}
              label="Gateway"
              description="API Gateway"
              nodeType={NodeType.NODE_TYPE_GATEWAY}
              onDragStart={onDragStart}
              color="text-purple-600"
              bg="bg-purple-100"
            />
            <SidebarItem
              icon={Workflow}
              label="Logic"
              description="Condition, Merge..."
              nodeType={NodeType.NODE_TYPE_LOGIC}
              onDragStart={onDragStart}
              color="text-orange-600"
              bg="bg-orange-100"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  description: string;
  nodeType: NodeType;
  onDragStart: (event: React.DragEvent, nodeType: NodeType) => void;
  color?: string;
  bg?: string;
}

function SidebarItem({
  icon: Icon,
  label,
  description,
  nodeType,
  onDragStart,
  color,
  bg,
}: SidebarItemProps) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors shadow-sm"
      onDragStart={(event) => onDragStart(event, nodeType)}
      draggable
    >
      <div className={cn("p-2 rounded-md shrink-0", bg)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="space-y-1">
        <div className="font-medium text-sm leading-none">{label}</div>
        <div className="text-[10px] text-muted-foreground leading-snug">
          {description}
        </div>
      </div>
    </div>
  );
}
