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
        "min-w-[260px] shadow-sm transition-all duration-300 relative group bg-card/95 backdrop-blur-sm border-muted/40",
        selected
          ? "ring-2 ring-orange-500 border-orange-500 shadow-lg shadow-orange-500/10"
          : "hover:border-orange-500/50 hover:shadow-md"
      )}
    >
      <div className={cn(
        "absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-medium tracking-wider border rounded-full bg-background shadow-sm transition-colors",
        selected ? "text-orange-600 border-orange-500/30" : "text-muted-foreground border-border"
      )}>
        DATABASE
      </div>
      <CardHeader className="p-4 pb-2 pt-5 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl transition-colors duration-300",
            selected ? "bg-orange-500/15 text-orange-600" : "bg-orange-500/10 text-orange-600/80 group-hover:bg-orange-500/15 group-hover:text-orange-600"
          )}>
            <Database className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div
              className="font-semibold text-sm truncate max-w-[140px] leading-none"
              title={data.name}
            >
              {data.name}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {data.id.slice(0, 8)}
            </div>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
          <Settings2 className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </div>
      </CardHeader>
      <Separator className="my-2 opacity-50 mx-4 w-auto" />
      <CardContent className="p-4 pt-1">
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
          <span className="font-medium text-foreground/80">Engine</span>
          {/* Placeholder logic for engine */}
          <span className="font-mono bg-orange-500/5 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded text-[10px]">Postgres</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className="text-[10px] px-2 py-0 h-5 font-medium bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20 shadow-none"
          >
            SQL
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-mono border-muted-foreground/30 text-muted-foreground">
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
