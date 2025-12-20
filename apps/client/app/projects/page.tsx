"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { frontendApi } from "@/lib/frontend-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import { parseAsInteger, useQueryState } from "nuqs";

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ProjectsClient />
    </Suspense>
  );
}

function ProjectsClient() {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(12));

  const projectsQuery = useQuery(
    frontendApi.queries.graph.listProjects({
      page: String(page),
      limit: String(limit),
    })
  );
  const projects = projectsQuery.data?.data?.projects ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button asChild>
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block"
          >
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>
                  Graph version: {project.graphVersion}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {projectsQuery.isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading projects...
        </div>
      )}

      {projectsQuery.isError && (
        <div className="text-center py-12 text-destructive">
          Failed to load projects
        </div>
      )}

      {!projectsQuery.isLoading && projects.length === 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              Create your first project to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
