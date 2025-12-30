"use client";

import { memo } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { Workflow, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GraphFlowNodeData } from "@/utils/graph-converter";

export const LogicNode = memo(function LogicNode({
  data,
  selected,
}: NodeProps<GraphFlowNodeData>) {
  return (
    <Card
      className={cn(
        "min-w-[200px] shadow-sm transition-all relative group border-orange-200",
        selected
          ? "ring-2 ring-orange-500 border-orange-500 shadow-lg"
          : "hover:border-orange-300"
      )}
    >
      <div className="absolute -top-3 left-3 bg-background px-2 text-[10px] text-orange-600 font-mono border border-orange-200 rounded-full">
        LOGIC
      </div>
      <CardHeader className="p-3 pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-md group-hover:bg-orange-200 transition-colors">
            <Workflow className="w-4 h-4 text-orange-600" />
          </div>
          <div
            className="font-bold text-sm truncate max-w-[120px]"
            title={data.name}
          >
            {data.name}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Settings2 className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </CardHeader>
      <Separator className="my-1 opacity-50 bg-orange-100" />
      <CardContent className="p-3 pt-1">
        <div className="text-xs text-muted-foreground">
          Control flow logic
        </div>
      </CardContent>
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-background bg-muted-foreground hover:bg-orange-500 transition-colors -left-1.5!"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-background bg-orange-500 hover:scale-125 transition-transform -right-1.5!"
      />
    </Card>
  );
});

