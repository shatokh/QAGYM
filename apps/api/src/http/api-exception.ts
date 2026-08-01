import { HttpException, HttpStatus } from "@nestjs/common";

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[];
  };
}

export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(
      {
        error: {
          code,
          message,
          details,
        },
      } satisfies ApiErrorResponse,
      status,
    );
  }
}

export function invalidRequest(
  details: ApiErrorDetail[],
): ApiException {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    "INVALID_REQUEST",
    "Request validation failed.",
    details,
  );
}

export function comicNotFound(): ApiException {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    "COMIC_NOT_FOUND",
    "Comic not found.",
  );
}

export function invalidCredentials(): ApiException {
  return new ApiException(
    HttpStatus.UNAUTHORIZED,
    "INVALID_CREDENTIALS",
    "Invalid email or password.",
  );
}

export function unauthenticated(): ApiException {
  return new ApiException(
    HttpStatus.UNAUTHORIZED,
    "UNAUTHENTICATED",
    "Authentication required.",
  );
}

export function authRateLimited(): ApiException {
  return new ApiException(
    HttpStatus.TOO_MANY_REQUESTS,
    "AUTH_RATE_LIMITED",
    "Too many authentication attempts.",
  );
}
