"use client";

import { memo } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { NodeType } from "@axion/contracts";
import { formatProtoEnum } from "@/utils/proto-enum";
import type { GraphFlowNodeData } from "@/utils/graph-converter";

export const DatabaseNode = memo(function DatabaseNode({
  data,
  selected,
}: NodeProps<GraphFlowNodeData>) {
  return (
    <div
      className={cn(
        "px-4 py-2 shadow-sm rounded-lg bg-card border-2 min-w-[200px] text-card-foreground",
        selected ? "border-ring" : "border-border"
      )}
    >
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-primary" />
        <div className="font-bold">{data.name}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {formatProtoEnum(NodeType, data.type)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary"
      />
    </div>
  );
});
