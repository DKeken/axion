"use client";

import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Status } from "@axion/contracts";
import { frontendApi } from "@/lib/frontend-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createProjectMutation = useMutation({
    mutationFn: (projectName: string) =>
      frontendApi.graph.createProject({
        name: projectName,
        infrastructureConfig: {},
      }),
    onSuccess: (response) => {
      if (response.status === Status.STATUS_SUCCESS && response.project) {
        router.push(ROUTES.DASHBOARD.PROJECTS.ID(response.project.id));
      } else if (response.error) {
        setError(response.error.message);
      }
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create project");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    setError(null);
    createProjectMutation.mutate(name);
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Give your project a name to get started with the graph editor.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Project Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. My Awesome App"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createProjectMutation.isPending}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={createProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending
                ? "Creating..."
                : "Create Project"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
