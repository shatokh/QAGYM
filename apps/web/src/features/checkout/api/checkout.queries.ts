import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CatalogLocale } from "../../catalog/api/catalog.contract";
import { cartQueryKeys } from "../../cart/api/cart.queries";
import {
  checkout,
  getOrderDetail,
  getOrders,
  type OrderListRequest,
} from "./checkout.client";
import type {
  CheckoutRequest,
  CheckoutResponse,
  OrderDetailResponse,
  OrderListResponse,
} from "./checkout.contract";

export const orderQueryKeys = {
  all: ["orders"] as const,
  list: (request: OrderListRequest) =>
    [...orderQueryKeys.all, "list", request.page, request.pageSize] as const,
  detail: (orderNumber: string) =>
    [...orderQueryKeys.all, "detail", orderNumber] as const,
};

export function orderListQueryOptions(request: OrderListRequest) {
  return queryOptions({
    queryFn: ({ signal }) => getOrders(request, signal),
    queryKey: orderQueryKeys.list(request),
    retry: false,
  });
}

export function orderDetailQueryOptions(orderNumber: string) {
  return queryOptions({
    queryFn: ({ signal }) => getOrderDetail(orderNumber, signal),
    queryKey: orderQueryKeys.detail(orderNumber),
    retry: false,
  });
}

export function useOrderListQuery(
  request: OrderListRequest,
  enabled: boolean,
) {
  return useQuery({
    ...orderListQueryOptions(request),
    enabled,
  });
}

export function useOrderDetailQuery(
  orderNumber: string,
  enabled: boolean,
) {
  return useQuery({
    ...orderDetailQueryOptions(orderNumber),
    enabled,
  });
}

export function useCheckoutMutation(locale: CatalogLocale) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CheckoutRequest) => checkout(locale, request),
    onSuccess: (response) => {
      updateOrderCaches(queryClient, response);
      void queryClient.invalidateQueries({
        queryKey: cartQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: orderQueryKeys.all,
      });
    },
  });
}

function updateOrderCaches(
  queryClient: QueryClient,
  response: CheckoutResponse,
) {
  queryClient.setQueryData<OrderDetailResponse>(
    orderQueryKeys.detail(response.data.order.orderNumber),
    response,
  );
  queryClient.setQueriesData<OrderListResponse>(
    {
      queryKey: orderQueryKeys.all,
    },
    (current) => current,
  );
}
