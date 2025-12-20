"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type PropsWithChildren } from "react";
import { createQueryClient } from "@axion/frontend-api";
import { ThemeProvider } from "./theme-provider";
import { AuthUIProvider } from "@axion/better-auth/ui";
import { authClient } from "@/lib/auth-client";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthUIProvider authClient={authClient}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </AuthUIProvider>
    </ThemeProvider>
  );
}
