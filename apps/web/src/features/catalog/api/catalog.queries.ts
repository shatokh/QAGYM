import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getCatalogList,
  getComicDetail,
  type CatalogDetailRequest,
  type CatalogListRequest,
} from "./catalog.client";

export const catalogQueryKeys = {
  all: ["catalog"] as const,
  lists: () => [...catalogQueryKeys.all, "list"] as const,
  list: (request: CatalogListRequest) =>
    [
      ...catalogQueryKeys.lists(),
      request.locale,
      request.page,
      request.pageSize,
    ] as const,
  details: () => [...catalogQueryKeys.all, "detail"] as const,
  detail: (request: CatalogDetailRequest) =>
    [...catalogQueryKeys.details(), request.locale, request.slug] as const,
};

export function catalogListQueryOptions(request: CatalogListRequest) {
  return queryOptions({
    queryKey: catalogQueryKeys.list(request),
    queryFn: ({ signal }) => getCatalogList(request, signal),
  });
}

export function comicDetailQueryOptions(request: CatalogDetailRequest) {
  return queryOptions({
    queryKey: catalogQueryKeys.detail(request),
    queryFn: ({ signal }) => getComicDetail(request, signal),
  });
}

export function useCatalogListQuery(request: CatalogListRequest) {
  return useQuery(catalogListQueryOptions(request));
}

export function useComicDetailQuery(request: CatalogDetailRequest) {
  return useQuery(comicDetailQueryOptions(request));
}
