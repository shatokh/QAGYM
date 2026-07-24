import { QueryClient } from "@tanstack/react-query";
import { isCatalogApiError } from "../features/catalog/api/catalog.errors";

function shouldRetryRequest(failureCount: number, error: unknown): boolean {
  if (isCatalogApiError(error)) {
    if (error.kind === "contract" || error.kind === "aborted") {
      return false;
    }

    if (error.status !== null && error.status >= 400 && error.status < 500) {
      return false;
    }
  }

  return failureCount < 1;
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetryRequest,
        staleTime: 30 * 1000,
      },
    },
  });
}
