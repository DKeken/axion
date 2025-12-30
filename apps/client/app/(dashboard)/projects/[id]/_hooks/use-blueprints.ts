"use client";

import { useQuery } from "@tanstack/react-query";
import { frontendApi } from "@/lib/frontend-api";
import type { Blueprint } from "@axion/contracts";

export function useBlueprints() {
  const query = useQuery(frontendApi.queries.codegen.listBlueprints());

  const blueprints: Blueprint[] = query.data?.data?.blueprints ?? [];

  return {
    blueprints,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

