import type { ZodType } from "zod";
import type { CatalogLocale } from "../../catalog/api/catalog.contract";
import {
  apiErrorEnvelopeSchema,
  checkoutResponseSchema,
  csrfTokenResponseSchema,
  orderDetailResponseSchema,
  orderListResponseSchema,
  type CheckoutRequest,
  type CheckoutResponse,
  type OrderDetailResponse,
  type OrderListResponse,
} from "./checkout.contract";
import { CheckoutApiError, isAbortError } from "./checkout.errors";

export interface OrderListRequest {
  page: number;
  pageSize: number;
}

const CHECKOUT_ROUTES = {
  checkout: "/api/v1/checkout",
  csrfToken: "/api/v1/csrf-token",
  orders: "/api/v1/orders",
} as const;

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new CheckoutApiError("API request failed.", {
        cause: error,
        kind: "http",
        status: response.status,
      });
    }

    throw new CheckoutApiError(
      "API response does not match the checkout contract.",
      {
        cause: error,
        kind: "contract",
        status: response.status,
      },
    );
  }
}

async function requestJson<T>(
  input: string,
  options: RequestInit,
  schema: ZodType<T>,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      ...options,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new CheckoutApiError("API request was cancelled.", {
        cause: error,
        kind: "aborted",
      });
    }

    throw new CheckoutApiError("API request failed.", {
      cause: error,
      kind: "network",
    });
  }

  const body = await readJson(response);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(body);

    throw new CheckoutApiError(
      parsedError.success ? parsedError.data.error.message : "API request failed.",
      {
        code: parsedError.success ? parsedError.data.error.code : undefined,
        details: parsedError.success
          ? parsedError.data.error.details
          : undefined,
        kind: "http",
        status: response.status,
      },
    );
  }

  const parsedBody = schema.safeParse(body);

  if (!parsedBody.success) {
    throw new CheckoutApiError(
      "API response does not match the checkout contract.",
      {
        cause: parsedBody.error,
        kind: "contract",
        status: response.status,
      },
    );
  }

  return parsedBody.data;
}

async function getCsrfToken(): Promise<string> {
  const response = await requestJson(
    CHECKOUT_ROUTES.csrfToken,
    {
      method: "GET",
    },
    csrfTokenResponseSchema,
  );

  return response.data.csrfToken;
}

export async function checkout(
  locale: CatalogLocale,
  request: CheckoutRequest,
): Promise<CheckoutResponse> {
  const csrfToken = await getCsrfToken();
  const query = new URLSearchParams({ locale });

  return requestJson(
    `${CHECKOUT_ROUTES.checkout}?${query.toString()}`,
    {
      body: JSON.stringify(request),
      headers: {
        "X-QCG-CSRF-Token": csrfToken,
      },
      method: "POST",
    },
    checkoutResponseSchema,
  );
}

export function getOrders(
  request: OrderListRequest,
  signal?: AbortSignal,
): Promise<OrderListResponse> {
  const query = new URLSearchParams({
    page: String(request.page),
    pageSize: String(request.pageSize),
  });

  return requestJson(
    `${CHECKOUT_ROUTES.orders}?${query.toString()}`,
    {
      method: "GET",
      signal,
    },
    orderListResponseSchema,
  );
}

export function getOrderDetail(
  orderNumber: string,
  signal?: AbortSignal,
): Promise<OrderDetailResponse> {
  return requestJson(
    `${CHECKOUT_ROUTES.orders}/${encodeURIComponent(orderNumber)}`,
    {
      method: "GET",
      signal,
    },
    orderDetailResponseSchema,
  );
}
