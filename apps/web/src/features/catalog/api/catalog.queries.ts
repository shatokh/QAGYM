import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getCatalogList,
  getCatalogFilterOptions,
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
      request.q ?? "",
      request.genre ?? "",
      request.series ?? "",
      request.availability ?? "",
    ] as const,
  filterOptions: (locale: CatalogListRequest["locale"]) =>
    [...catalogQueryKeys.all, "filter-options", locale] as const,
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

export function catalogFilterOptionsQueryOptions(
  locale: CatalogListRequest["locale"],
) {
  return queryOptions({
    queryKey: catalogQueryKeys.filterOptions(locale),
    queryFn: ({ signal }) => getCatalogFilterOptions(locale, signal),
    staleTime: 5 * 60 * 1000,
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

export function useCatalogFilterOptionsQuery(
  locale: CatalogListRequest["locale"],
) {
  return useQuery(catalogFilterOptionsQueryOptions(locale));
}

export function useComicDetailQuery(request: CatalogDetailRequest) {
  return useQuery(comicDetailQueryOptions(request));
}
