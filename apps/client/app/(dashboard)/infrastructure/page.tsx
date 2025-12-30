"use client";

import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { useQuery } from "@tanstack/react-query";
import { frontendApi } from "@/lib/frontend-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Grid, Loader2, HardDrive, Wifi } from "lucide-react";

export default function InfrastructurePage() {
  const serversQuery = useQuery(frontendApi.queries.infrastructure.servers());
  const clustersQuery = useQuery(frontendApi.queries.infrastructure.clusters());
  const servers = serversQuery.data?.data?.servers ?? [];
  const clusters = clustersQuery.data?.data?.clusters ?? [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Инфраструктура</h1>
          <p className="text-muted-foreground mt-2">
            Управляйте вашими серверами и кластерами Kubernetes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href={ROUTES.DASHBOARD.INFRASTRUCTURE.SERVERS.NEW}>
              <Server className="h-4 w-4" /> Добавить сервер
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href={ROUTES.DASHBOARD.INFRASTRUCTURE.CLUSTERS.NEW}>
              <Grid className="h-4 w-4" /> Новый кластер
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Servers Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              Серверы{" "}
              <span className="text-muted-foreground ml-1 text-base font-normal">
                ({servers.length})
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {servers.map((server) => (
              <Card
                key={server.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
              >
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {server.host}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-mono bg-muted px-1 rounded">
                        {server.username}
                      </span>
                      <span>•</span>
                      <span>Порт {server.port}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500/20"
                  >
                    Активен
                  </Badge>
                </CardHeader>
                <CardContent />
              </Card>
            ))}

            {serversQuery.isLoading && (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Загрузка
                серверов...
              </div>
            )}

            {serversQuery.isError && (
              <div className="text-center py-8 text-destructive bg-destructive/5 rounded-lg border border-destructive/10">
                Не удалось загрузить список серверов
              </div>
            )}

            {!serversQuery.isLoading && servers.length === 0 && (
              <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Server className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Серверы не подключены
                  </p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/infrastructure/servers/new">
                      Добавить первый сервер
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Clusters Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Grid className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">
              Кластеры{" "}
              <span className="text-muted-foreground ml-1 text-base font-normal">
                ({clusters.length})
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {clusters.map((cluster) => (
              <Card
                key={cluster.id}
                className="hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {cluster.name}
                  </CardTitle>
                  <CardDescription>
                    {cluster.description || "Нет описания"}
                  </CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}

            {clustersQuery.isLoading && (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Загрузка
                кластеров...
              </div>
            )}

            {clustersQuery.isError && (
              <div className="text-center py-8 text-destructive bg-destructive/5 rounded-lg border border-destructive/10">
                Не удалось загрузить кластеры
              </div>
            )}

            {!clustersQuery.isLoading && clusters.length === 0 && (
              <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Wifi className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Кластеры не настроены
                  </p>
                  <Button variant="link" asChild className="mt-2 text-blue-500">
                    <Link href="/infrastructure/clusters/new">
                      Создать кластер
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
