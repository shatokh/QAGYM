import type { ZodType } from "zod";
import type { CatalogLocale } from "../../catalog/api/catalog.contract";
import {
  apiErrorEnvelopeSchema,
  cartResponseSchema,
  csrfTokenResponseSchema,
  type CartResponse,
} from "./cart.contract";
import { CartApiError, isAbortError } from "./cart.errors";

export interface AddCartLineRequest {
  comicSlug: string;
  quantity: number;
}

export interface UpdateCartLineRequest {
  comicSlug: string;
  quantity: number;
}

const CART_ROUTES = {
  csrfToken: "/api/v1/csrf-token",
  cart: "/api/v1/cart",
  lines: "/api/v1/cart/lines",
} as const;

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new CartApiError("API request failed.", {
        cause: error,
        kind: "http",
        status: response.status,
      });
    }

    throw new CartApiError(
      "API response does not match the cart contract.",
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
      throw new CartApiError("API request was cancelled.", {
        cause: error,
        kind: "aborted",
      });
    }

    throw new CartApiError("API request failed.", {
      cause: error,
      kind: "network",
    });
  }

  const body = await readJson(response);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(body);

    throw new CartApiError(
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
    throw new CartApiError("API response does not match the cart contract.", {
      cause: parsedBody.error,
      kind: "contract",
      status: response.status,
    });
  }

  return parsedBody.data;
}

export function getCart(
  locale: CatalogLocale,
  signal?: AbortSignal,
): Promise<CartResponse> {
  const query = new URLSearchParams({ locale });

  return requestJson(
    `${CART_ROUTES.cart}?${query.toString()}`,
    {
      method: "GET",
      signal,
    },
    cartResponseSchema,
  );
}

async function getCsrfToken(): Promise<string> {
  const response = await requestJson(
    CART_ROUTES.csrfToken,
    {
      method: "GET",
    },
    csrfTokenResponseSchema,
  );

  return response.data.csrfToken;
}

export async function addCartLine(
  request: AddCartLineRequest,
): Promise<CartResponse> {
  const csrfToken = await getCsrfToken();

  return requestJson(
    CART_ROUTES.lines,
    {
      body: JSON.stringify(request),
      headers: {
        "X-QCG-CSRF-Token": csrfToken,
      },
      method: "POST",
    },
    cartResponseSchema,
  );
}

export async function updateCartLine(
  request: UpdateCartLineRequest,
): Promise<CartResponse> {
  const csrfToken = await getCsrfToken();

  return requestJson(
    `${CART_ROUTES.lines}/${encodeURIComponent(request.comicSlug)}`,
    {
      body: JSON.stringify({ quantity: request.quantity }),
      headers: {
        "X-QCG-CSRF-Token": csrfToken,
      },
      method: "PATCH",
    },
    cartResponseSchema,
  );
}

export async function removeCartLine(comicSlug: string): Promise<void> {
  const csrfToken = await getCsrfToken();
  let response: Response;

  try {
    response = await fetch(
      `${CART_ROUTES.lines}/${encodeURIComponent(comicSlug)}`,
      {
        credentials: "same-origin",
        headers: {
          "X-QCG-CSRF-Token": csrfToken,
        },
        method: "DELETE",
      },
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw new CartApiError("API request was cancelled.", {
        cause: error,
        kind: "aborted",
      });
    }

    throw new CartApiError("API request failed.", {
      cause: error,
      kind: "network",
    });
  }

  if (!response.ok) {
    const body = await readJson(response);
    const parsedError = apiErrorEnvelopeSchema.safeParse(body);

    throw new CartApiError(
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
}
