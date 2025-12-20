"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { DeploymentStatus } from "@axion/contracts";
import { frontendApi } from "@/lib/frontend-api";
import { formatProtoEnum } from "@/utils/proto-enum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

export default function DeploymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      }
    >
      <DeploymentsClient />
    </Suspense>
  );
}

function DeploymentsClient() {
  const [projectId] = useQueryState("projectId", parseAsString);
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

  const deploymentsQuery = useQuery({
    queryKey: projectId
      ? frontendApi.queries.deployment.deployments(projectId, {
          page: String(page),
          limit: String(limit),
        }).queryKey
      : ["deployment", "no-project"],
    queryFn: projectId
      ? ({ signal }) =>
          frontendApi.deployment.listDeployments(
            projectId,
            { page: String(page), limit: String(limit) },
            { signal }
          )
      : skipToken,
  });
  const deployments = deploymentsQuery.data?.data?.deployments ?? [];

  if (!projectId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Select a project to view deployments (set ?projectId=...).
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deployments</h1>
      </div>

      <div className="space-y-4">
        {deployments.map((deployment) => {
          if (!deployment) return null;
          return (
            <Card key={deployment.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">Deployment</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {deployment.id}
                  </div>
                </div>
                <Badge variant="secondary">
                  {formatProtoEnum(DeploymentStatus, deployment.status)}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Status: {formatProtoEnum(DeploymentStatus, deployment.status)}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {deploymentsQuery.isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading deployments...
          </div>
        )}
        {deploymentsQuery.isError && (
          <div className="text-center py-12 text-destructive">
            Failed to load deployments
          </div>
        )}
        {!deploymentsQuery.isLoading && deployments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No deployments yet.
          </div>
        )}
      </div>
    </div>
  );
}
