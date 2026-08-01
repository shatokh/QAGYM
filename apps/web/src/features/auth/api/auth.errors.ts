import type { ApiErrorDetail } from "./auth.contract";

export type AuthApiErrorKind = "http" | "network" | "contract" | "aborted";

interface AuthApiErrorOptions {
  cause?: unknown;
  code?: string;
  details?: ApiErrorDetail[];
  kind: AuthApiErrorKind;
  status?: number;
}

export class AuthApiError extends Error {
  readonly code: string | null;
  readonly details: ApiErrorDetail[];
  readonly kind: AuthApiErrorKind;
  readonly status: number | null;

  constructor(message: string, options: AuthApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "AuthApiError";
    this.code = options.code ?? null;
    this.details = options.details ?? [];
    this.kind = options.kind;
    this.status = options.status ?? null;
  }
}

export function isAuthApiError(error: unknown): error is AuthApiError {
  return error instanceof AuthApiError;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
