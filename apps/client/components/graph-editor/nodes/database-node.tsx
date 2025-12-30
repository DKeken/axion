"use client";

import { memo } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { Database, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GraphFlowNodeData } from "@/lib/graph/converter";

export const DatabaseNode = memo(function DatabaseNode({
  data,
  selected,
}: NodeProps<GraphFlowNodeData>) {
  return (
    <Card
      className={cn(
        "min-w-[240px] shadow-sm transition-all relative group",
        selected
          ? "ring-2 ring-orange-500 border-orange-500 shadow-lg"
          : "hover:border-orange-500/50"
      )}
    >
      <div className="absolute -top-3 left-3 bg-background px-2 text-[10px] text-muted-foreground font-mono border rounded-full">
        DATABASE
      </div>
      <CardHeader className="p-3 pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 rounded-md group-hover:bg-orange-500/20 transition-colors">
            <Database className="w-4 h-4 text-orange-500" />
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
      <Separator className="my-1 opacity-50" />
      <CardContent className="p-3 pt-1">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Engine</span>
          {/* Placeholder logic for engine */}
          <span className="font-mono">Postgres</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="secondary"
            className="text-[10px] h-5 font-mono bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20 shadow-none"
          >
            SQL
          </Badge>
          <Badge variant="outline" className="text-[10px] h-5 font-mono">
            v16
          </Badge>
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
