"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { NodeType } from "@axion/contracts";
import { useEffect, useState } from "react";
import type { GraphFlowNodeData } from "@/lib/graph/converter";
import { useBlueprints } from "@/hooks/graph/use-blueprints";

// Fallback blueprints in case API fails or returns empty
const FALLBACK_BLUEPRINTS = [
  {
    id: "crud",
    name: "CRUD Service",
    description: "Standard REST API with database",
  },
  {
    id: "auth",
    name: "Authentication Service",
    description: "User auth with JWT/Session",
  },
  {
    id: "payment",
    name: "Payment Service",
    description: "Stripe/PayPal integration",
  },
  {
    id: "notification",
    name: "Notification Service",
    description: "Email/SMS/Push notifications",
  },
  {
    id: "custom",
    name: "Custom Service",
    description: "Empty service for custom logic",
  },
];

const LOGIC_TYPES = [
  { id: "if", name: "If / Else", description: "Conditional routing" },
  { id: "switch", name: "Switch", description: "Multi-path routing" },
  { id: "merge", name: "Merge", description: "Combine multiple flows" },
  {
    id: "filter",
    name: "Filter",
    description: "Filter data based on condition",
  },
];

interface NodePropertiesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: GraphFlowNodeData | null;
  onSave: (data: GraphFlowNodeData) => void;
  onDelete: () => void;
}

export function NodePropertiesSheet({
  open,
  onOpenChange,
  data,
  onSave,
  onDelete,
}: NodePropertiesSheetProps) {
  const [formData, setFormData] = useState<GraphFlowNodeData | null>(null);
  const { blueprints, isLoading: isLoadingBlueprints } = useBlueprints();

  const availableBlueprints =
    blueprints.length > 0
      ? blueprints.map((bp) => ({
          id: bp.id,
          name: bp.name,
          description: bp.description,
        }))
      : FALLBACK_BLUEPRINTS;

  useEffect(() => {
    setFormData(data);
  }, [data]);

  if (!formData) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => (prev ? { ...prev, name: e.target.value } : null));
  };

  const handleConfigChange = (key: string, value: string) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            config: { ...prev.config, [key]: value },
          }
        : null
    );
  };

  const handleBlueprintChange = (value: string) => {
    setFormData((prev) => (prev ? { ...prev, blueprintId: value } : null));
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onOpenChange(false);
    }
  };

  const isDatabase = formData.type === NodeType.NODE_TYPE_DATABASE;
  const isLogic = formData.type === NodeType.NODE_TYPE_LOGIC;
  const isService = formData.type === NodeType.NODE_TYPE_SERVICE;
  const isGateway = formData.type === NodeType.NODE_TYPE_GATEWAY;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Edit{" "}
            {isDatabase
              ? "Database"
              : isLogic
                ? "Logic"
                : isGateway
                  ? "Gateway"
                  : "Service"}
          </SheetTitle>
          <SheetDescription>
            Configure the properties for this node.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          {/* Common Fields */}
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Node name"
            />
          </div>

          <Separator />

          {/* Service Specific Fields */}
          {isService && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="blueprint">Blueprint</Label>
                <Select
                  value={formData.blueprintId || "custom"}
                  onValueChange={handleBlueprintChange}
                  disabled={isLoadingBlueprints}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingBlueprints ? "Loading..." : "Select blueprint"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBlueprints.map((bp) => (
                      <SelectItem key={bp.id} value={bp.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{bp.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {bp.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (for AI)</Label>
                <Textarea
                  id="description"
                  value={formData.config?.description || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleConfigChange("description", e.target.value)
                  }
                  placeholder="Describe what this service should do..."
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}

          {/* Database Specific Fields */}
          {isDatabase && (
            <div className="grid gap-2">
              <Label htmlFor="db-type">Database Engine</Label>
              <Select
                value={formData.config?.type || "postgres"}
                onValueChange={(val) => handleConfigChange("type", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgres">PostgreSQL</SelectItem>
                  <SelectItem value="redis">Redis</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="mongo">MongoDB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Logic Specific Fields */}
          {isLogic && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="logic-type">Logic Type</Label>
                <Select
                  value={formData.config?.subtype || "if"}
                  onValueChange={(val) => handleConfigChange("subtype", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGIC_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{type.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expression">Condition / Expression</Label>
                <Textarea
                  id="expression"
                  value={formData.config?.expression || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleConfigChange("expression", e.target.value)
                  }
                  placeholder="e.g. data.status === 'active'"
                  className="font-mono text-sm"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleSave}>Save Changes</Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete Node
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
