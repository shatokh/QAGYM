import type { ZodType } from "zod";
import {
  apiErrorEnvelopeSchema,
  authUserResponseSchema,
  type AuthUser,
  type LoginRequest,
} from "./auth.contract";
import { AuthApiError, isAbortError } from "./auth.errors";

const AUTH_ROUTES = {
  login: "/api/v1/auth/login",
  logout: "/api/v1/auth/logout",
  me: "/api/v1/auth/me",
} as const;

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new AuthApiError("API request failed.", {
        cause: error,
        kind: "http",
        status: response.status,
      });
    }

    throw new AuthApiError(
      "API response does not match the auth contract.",
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
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new AuthApiError("API request was cancelled.", {
        cause: error,
        kind: "aborted",
      });
    }

    throw new AuthApiError("API request failed.", {
      cause: error,
      kind: "network",
    });
  }

  const body = await readJson(response);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(body);

    throw new AuthApiError(
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
    throw new AuthApiError("API response does not match the auth contract.", {
      cause: parsedBody.error,
      kind: "contract",
      status: response.status,
    });
  }

  return parsedBody.data;
}

export async function getCurrentUser(
  signal?: AbortSignal,
): Promise<AuthUser | null> {
  try {
    const response = await requestJson(
      AUTH_ROUTES.me,
      {
        method: "GET",
        signal,
      },
      authUserResponseSchema,
    );

    return response.data.user;
  } catch (error) {
    if (
      error instanceof AuthApiError &&
      error.status === 401 &&
      error.code === "UNAUTHENTICATED"
    ) {
      return null;
    }

    throw error;
  }
}

export async function login(request: LoginRequest): Promise<AuthUser> {
  const response = await requestJson(
    AUTH_ROUTES.login,
    {
      body: JSON.stringify(request),
      method: "POST",
    },
    authUserResponseSchema,
  );

  return response.data.user;
}

export async function logout(): Promise<void> {
  let response: Response;

  try {
    response = await fetch(AUTH_ROUTES.logout, {
      body: "{}",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new AuthApiError("API request was cancelled.", {
        cause: error,
        kind: "aborted",
      });
    }

    throw new AuthApiError("API request failed.", {
      cause: error,
      kind: "network",
    });
  }

  if (!response.ok) {
    const body = await readJson(response);
    const parsedError = apiErrorEnvelopeSchema.safeParse(body);

    throw new AuthApiError(
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
