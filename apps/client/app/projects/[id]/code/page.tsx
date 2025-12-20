"use client";

import { useParams } from "next/navigation";
import { ValidationStatus } from "@axion/contracts";
import { useMutation } from "@tanstack/react-query";
import { frontendApi } from "@/lib/frontend-api";
import { formatProtoEnum } from "@/utils/proto-enum";
import { config } from "@/config/env";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CodePreviewPage() {
  const params = useParams();
  const projectId = params.id as string;

  const validateProject = useMutation({
    mutationFn: () =>
      frontendApi.codegen.validateProject(projectId, {
        aiModel: config.aiModel,
      }),
  });

  const data = validateProject.data?.data;
  const results = data?.results ?? [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Validation</h1>
          <p className="text-muted-foreground mt-1">
            Run contract-driven validation for this project.
          </p>
        </div>
        <Button
          onClick={() => validateProject.mutate()}
          disabled={validateProject.isPending}
        >
          {validateProject.isPending ? "Validating..." : "Run validation"}
        </Button>
      </div>

      {validateProject.isError && (
        <Card>
          <CardHeader>
            <CardTitle>Validation failed</CardTitle>
            <CardDescription>Try again or check service logs.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!validateProject.data &&
        !validateProject.isPending &&
        !validateProject.isError && (
          <Card>
            <CardHeader>
              <CardTitle>No results yet</CardTitle>
              <CardDescription>
                Click “Run validation” to generate validation results.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

      {results.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Total services: {data?.totalServices ?? 0} • Validated:{" "}
                {data?.validated ?? 0} • Failed: {data?.failed ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>

          {results.map((result) => (
            <Card key={`${result.nodeId}:${result.serviceId}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {result.serviceId || result.nodeId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Node: {result.nodeId}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {formatProtoEnum(ValidationStatus, result.status)}
                  </Badge>
                </div>
                {(result.errors?.length ?? 0) > 0 && (
                  <div className="mt-3 text-sm text-destructive">
                    {result.errors?.length} error(s)
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
