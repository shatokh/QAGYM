import type { ComponentProps } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AppErrorBoundary } from "./app/AppErrorBoundary";

type AppRouter = ComponentProps<typeof RouterProvider>["router"];

interface AppProps {
  queryClient: QueryClient;
  router: AppRouter;
}

export function App({ queryClient, router }: AppProps) {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
