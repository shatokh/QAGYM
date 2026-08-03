import type { ApiErrorDetail } from "./checkout.contract";

type CheckoutApiErrorKind = "aborted" | "contract" | "http" | "network";

interface CheckoutApiErrorOptions {
  cause?: unknown;
  code?: string;
  details?: ApiErrorDetail[];
  kind: CheckoutApiErrorKind;
  status?: number;
}

export class CheckoutApiError extends Error {
  readonly code?: string;
  readonly details?: ApiErrorDetail[];
  readonly kind: CheckoutApiErrorKind;
  readonly status?: number;

  constructor(message: string, options: CheckoutApiErrorOptions) {
    super(message);
    this.name = "CheckoutApiError";
    this.cause = options.cause;
    this.code = options.code;
    this.details = options.details;
    this.kind = options.kind;
    this.status = options.status;
  }
}

export function isCheckoutApiError(error: unknown): error is CheckoutApiError {
  return error instanceof CheckoutApiError;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
