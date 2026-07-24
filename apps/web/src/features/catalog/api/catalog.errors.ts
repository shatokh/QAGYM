import type { ApiErrorEnvelope } from "./catalog.contract";

export type CatalogApiErrorKind =
  | "aborted"
  | "contract"
  | "http"
  | "network";

interface CatalogApiErrorOptions {
  cause?: unknown;
  code?: string;
  details?: ApiErrorEnvelope["error"]["details"];
  kind: CatalogApiErrorKind;
  status?: number | null;
}

export class CatalogApiError extends Error {
  readonly code: string | null;
  readonly details: ApiErrorEnvelope["error"]["details"];
  readonly kind: CatalogApiErrorKind;
  readonly status: number | null;

  constructor(message: string, options: CatalogApiErrorOptions) {
    super(message, {
      cause: options.cause,
    });
    this.name = "CatalogApiError";
    this.code = options.code ?? null;
    this.details = options.details ?? [];
    this.kind = options.kind;
    this.status = options.status ?? null;
  }
}

export function isCatalogApiError(error: unknown): error is CatalogApiError {
  return error instanceof CatalogApiError;
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}
