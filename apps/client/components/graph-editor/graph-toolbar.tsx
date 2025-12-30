"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Box, Database } from "lucide-react";
import { memo } from "react";
import { NodeType } from "@axion/contracts";

interface GraphToolbarProps {
  onAddNode: (type: NodeType) => void;
}

export const GraphToolbar = memo(function GraphToolbar({
  onAddNode,
}: GraphToolbarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur border rounded-full shadow-lg p-2 flex gap-2 z-10">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-dashed border-2 hover:border-solid hover:border-primary hover:text-primary transition-all"
              onClick={() => onAddNode(NodeType.NODE_TYPE_SERVICE)}
            >
              <Box className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Service</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-dashed border-2 hover:border-solid hover:border-orange-500 hover:text-orange-500 transition-all"
              onClick={() => onAddNode(NodeType.NODE_TYPE_DATABASE)}
            >
              <Database className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Database</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});
