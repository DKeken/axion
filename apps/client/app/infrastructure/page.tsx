"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { frontendApi } from "@/lib/frontend-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InfrastructurePage() {
  const serversQuery = useQuery(frontendApi.queries.infrastructure.servers());
  const clustersQuery = useQuery(frontendApi.queries.infrastructure.clusters());
  const servers = serversQuery.data?.data?.servers ?? [];
  const clusters = clustersQuery.data?.data?.clusters ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Infrastructure</h1>
        <div className="flex space-x-2">
          <Button asChild variant="secondary">
            <Link href="/infrastructure/servers/new">Add server</Link>
          </Button>
          <Button asChild>
            <Link href="/infrastructure/clusters/new">New cluster</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Servers ({servers.length})
          </h2>
          <div className="space-y-4">
            {servers.map((server) => (
              <Card key={server.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{server.host}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {server.port} • {server.username}
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
            {serversQuery.isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading servers...
              </div>
            )}
            {serversQuery.isError && (
              <div className="text-center py-8 text-destructive">
                Failed to load servers
              </div>
            )}
            {!serversQuery.isLoading && servers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No servers configured
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Clusters ({clusters.length})
          </h2>
          <div className="space-y-4">
            {clusters.map((cluster) => (
              <Card key={cluster.id}>
                <CardHeader>
                  <CardTitle className="text-base">{cluster.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {cluster.description || "No description"}
                  </div>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
            {clustersQuery.isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading clusters...
              </div>
            )}
            {clustersQuery.isError && (
              <div className="text-center py-8 text-destructive">
                Failed to load clusters
              </div>
            )}
            {!clustersQuery.isLoading && clusters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No clusters configured
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
