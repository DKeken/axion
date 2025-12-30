"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { DeploymentStatus } from "@axion/contracts";
import { frontendApi } from "@/lib/frontend-api";
import { formatProtoEnum } from "@/lib/proto-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Rocket, Box, Loader2, AlertCircle } from "lucide-react";

export default function DeploymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <div className="bg-accent/50 p-6 rounded-full mb-6">
          <Rocket className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Проект не выбран
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Пожалуйста, выберите проект в консоли, чтобы просмотреть его
          развертывания.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Развертывания</h1>
          <p className="text-muted-foreground mt-2">
            История и статус развертываний вашего проекта.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {deployments.map((deployment) => {
          if (!deployment) return null;
          return (
            <Card
              key={deployment.id}
              className="transition-all hover:shadow-md border-l-4 border-l-primary/0 hover:border-l-primary/50"
            >
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Box className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                      Развертывание{" "}
                      <span className="font-mono text-muted-foreground ml-2 text-xs">
                        {deployment.id.slice(0, 8)}
                      </span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                      Статус:{" "}
                      {formatProtoEnum(DeploymentStatus, deployment.status)}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    deployment.status ===
                    DeploymentStatus.DEPLOYMENT_STATUS_SUCCESS
                      ? "default"
                      : deployment.status ===
                          DeploymentStatus.DEPLOYMENT_STATUS_FAILED
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {formatProtoEnum(DeploymentStatus, deployment.status)}
                </Badge>
              </CardHeader>
              <CardContent>
                {/* Additional details like timestamp could be added here if available in the deployment object */}
              </CardContent>
            </Card>
          );
        })}

        {deploymentsQuery.isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Загрузка развертываний...
            </span>
          </div>
        )}

        {deploymentsQuery.isError && (
          <div className="flex flex-col items-center justify-center py-12 text-destructive">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Не удалось загрузить историю развертываний</p>
          </div>
        )}

        {!deploymentsQuery.isLoading && deployments.length === 0 && (
          <div className="text-center py-12 border rounded-xl border-dashed bg-muted/20">
            <Rocket className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium">Развертываний пока нет</h3>
            <p className="text-muted-foreground">
              Запустите ваше первое развертывание через редактор.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
