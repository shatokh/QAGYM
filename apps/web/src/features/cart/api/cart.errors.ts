import type { ApiErrorDetail } from "./cart.contract";

export type CartApiErrorKind = "http" | "network" | "contract" | "aborted";

interface CartApiErrorOptions {
  cause?: unknown;
  code?: string;
  details?: ApiErrorDetail[];
  kind: CartApiErrorKind;
  status?: number;
}

export class CartApiError extends Error {
  readonly code: string | null;
  readonly details: ApiErrorDetail[];
  readonly kind: CartApiErrorKind;
  readonly status: number | null;

  constructor(message: string, options: CartApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "CartApiError";
    this.code = options.code ?? null;
    this.details = options.details ?? [];
    this.kind = options.kind;
    this.status = options.status ?? null;
  }
}

export function isCartApiError(error: unknown): error is CartApiError {
  return error instanceof CartApiError;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
