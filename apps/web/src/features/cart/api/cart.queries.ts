import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CatalogLocale } from "../../catalog/api/catalog.contract";
import {
  addCartLine,
  getCart,
  removeCartLine,
  updateCartLine,
  type AddCartLineRequest,
  type UpdateCartLineRequest,
} from "./cart.client";
import type { CartResponse } from "./cart.contract";

export const cartQueryKeys = {
  all: ["cart"] as const,
  current: (locale: CatalogLocale) =>
    [...cartQueryKeys.all, "current", locale] as const,
};

export function cartQueryOptions(locale: CatalogLocale) {
  return queryOptions({
    queryFn: ({ signal }) => getCart(locale, signal),
    queryKey: cartQueryKeys.current(locale),
    retry: false,
  });
}

export function useCartQuery(
  locale: CatalogLocale,
  enabled: boolean,
) {
  return useQuery({
    ...cartQueryOptions(locale),
    enabled,
  });
}

export function useAddCartLineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddCartLineRequest) => addCartLine(request),
    onSuccess: (response) => {
      updateCartCaches(queryClient, response);
    },
  });
}

export function useUpdateCartLineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateCartLineRequest) => updateCartLine(request),
    onSuccess: (response) => {
      updateCartCaches(queryClient, response);
    },
  });
}

export function useRemoveCartLineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCartLine,
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: cartQueryKeys.all,
      });
    },
  });
}

function updateCartCaches(
  queryClient: QueryClient,
  response: CartResponse,
) {
  queryClient.setQueriesData<CartResponse>(
    {
      queryKey: cartQueryKeys.all,
    },
    response,
  );
  void queryClient.invalidateQueries({
    queryKey: cartQueryKeys.all,
  });
}
