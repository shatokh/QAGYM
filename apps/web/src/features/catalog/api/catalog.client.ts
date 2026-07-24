import type { ZodType } from "zod";
import {
  apiErrorEnvelopeSchema,
  catalogDetailResponseSchema,
  catalogListResponseSchema,
  type CatalogDetailResponse,
  type CatalogListResponse,
  type CatalogLocale,
} from "./catalog.contract";
import { CatalogApiError, isAbortError } from "./catalog.errors";

export interface CatalogListRequest {
  locale: CatalogLocale;
  page: number;
  pageSize: number;
}

export interface CatalogDetailRequest {
  locale: CatalogLocale;
  slug: string;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new CatalogApiError("API request failed.", {
        cause: error,
        kind: "http",
        status: response.status,
      });
    }

    throw new CatalogApiError(
      "API response does not match the catalog contract.",
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
  schema: ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      headers: {
        Accept: "application/json",
      },
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new CatalogApiError("API request was cancelled.", {
        cause: error,
        kind: "aborted",
      });
    }

    throw new CatalogApiError("API request failed.", {
      cause: error,
      kind: "network",
    });
  }

  const body = await readJson(response);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(body);

    throw new CatalogApiError(
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
    throw new CatalogApiError("API response does not match the catalog contract.", {
      cause: parsedBody.error,
      kind: "contract",
      status: response.status,
    });
  }

  return parsedBody.data;
}

export function getCatalogList(
  request: CatalogListRequest,
  signal?: AbortSignal,
): Promise<CatalogListResponse> {
  const query = new URLSearchParams({
    page: String(request.page),
    pageSize: String(request.pageSize),
    locale: request.locale,
  });

  return requestJson(
    `/api/v1/comics?${query.toString()}`,
    catalogListResponseSchema,
    signal,
  );
}

export function getComicDetail(
  request: CatalogDetailRequest,
  signal?: AbortSignal,
): Promise<CatalogDetailResponse> {
  const query = new URLSearchParams({
    locale: request.locale,
  });

  return requestJson(
    `/api/v1/comics/${encodeURIComponent(request.slug)}?${query.toString()}`,
    catalogDetailResponseSchema,
    signal,
  );
}
