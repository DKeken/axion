"use client";

import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { useQuery } from "@tanstack/react-query";
import { frontendApi } from "@/lib/frontend-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Suspense } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { Plus, Calendar, Clock, Loader2, Folder, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Проекты</h1>
          <p className="text-muted-foreground mt-2">
            Управляйте своими архитектурными графами и сервисами.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2 shadow-sm">
          <Link href="/projects/new">
            <Plus className="h-4 w-4" /> Новый проект
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border bg-card/50 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <ProjectsClient />
      </Suspense>
    </div>
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

  if (projectsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 rounded-xl border bg-card/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (projectsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-xl border border-destructive/20 text-center">
        <div className="p-3 bg-destructive/10 rounded-full mb-4">
          <Loader2 className="h-6 w-6 text-destructive animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Ошибка загрузки
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Не удалось загрузить список проектов. Пожалуйста, попробуйте позже.
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed">
        <div className="p-4 bg-primary/5 rounded-full mb-6">
          <Folder className="h-10 w-10 text-primary/50" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Проектов пока нет</CardTitle>
          <CardDescription className="text-lg max-w-md mx-auto mt-2">
            Создайте свой первый проект, чтобы начать проектировать архитектуру.
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-6">
          <Button asChild size="lg">
            <Link href={ROUTES.DASHBOARD.PROJECTS.NEW}>
              <Plus className="h-4 w-4 mr-2" /> Создать проект
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={ROUTES.DASHBOARD.PROJECTS.ID(project.id)}
          className="group block h-full"
        >
          <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 bg-card group-hover:bg-accent/5">
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="line-clamp-1 text-xl group-hover:text-primary transition-colors">
                  {project.name}
                </CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                Версия графа:{" "}
                <Badge variant="secondary" className="ml-1 font-mono text-xs">
                  {project.graphVersion}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Future description or stats could go here */}
              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden mt-2">
                <div className="h-full w-1/3 bg-primary/20 group-hover:bg-primary/50 transition-colors" />
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground flex gap-4 mt-auto pt-4 border-t">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(project.createdAt).toLocaleDateString("ru-RU")}
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" />
                {new Date(project.createdAt).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
