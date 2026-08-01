import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentUser,
  login,
  logout,
} from "./auth.client";
import { AuthApiError } from "./auth.errors";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const userResponse = {
  data: {
    user: {
      id: "usr_demo_user",
      email: "user@qacomics.local",
      displayName: "Demo User",
      role: "USER",
    },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auth API client", () => {
  it("loads the current user with same-origin credentials", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(userResponse));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).resolves.toEqual(userResponse.data.user);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/me",
      expect.objectContaining({
        credentials: "same-origin",
        method: "GET",
      }),
    );
  });

  it("maps UNAUTHENTICATED current-user responses to guest state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "UNAUTHENTICATED",
              message: "Authentication required.",
              details: [],
            },
          },
          401,
        ),
      ),
    );

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("posts login JSON and validates the auth DTO", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(userResponse));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({
        email: "user@qacomics.local",
        password: "DemoUserPassphrase2026!",
      }),
    ).resolves.toEqual(userResponse.data.user);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "user@qacomics.local",
          password: "DemoUserPassphrase2026!",
        }),
        credentials: "same-origin",
        method: "POST",
      }),
    );
  });

  it("surfaces stable auth error codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or password.",
              details: [],
            },
          },
          401,
        ),
      ),
    );

    await expect(
      login({
        email: "user@qacomics.local",
        password: "wrong",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      status: 401,
    } satisfies Partial<AuthApiError>);
  });

  it("posts logout as an empty JSON object with same-origin credentials", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(logout()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({
        body: "{}",
        credentials: "same-origin",
        method: "POST",
      }),
    );
  });
});
