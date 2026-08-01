import { QueryClient } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import { appRoutes } from "../../app/router";
import {
  catalogFilterOptionsResponseFixture,
  catalogListResponseFixture,
} from "../../test/catalog-fixtures";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const unauthenticatedResponse = {
  error: {
    code: "UNAUTHENTICATED",
    message: "Authentication required.",
    details: [],
  },
};

const invalidCredentialsResponse = {
  error: {
    code: "INVALID_CREDENTIALS",
    message: "Invalid email or password.",
    details: [],
  },
};

const demoUserResponse = {
  data: {
    user: {
      id: "usr_demo_user",
      email: "user@qacomics.local",
      displayName: "Demo User",
      role: "USER",
    },
  },
};

const demoAdminResponse = {
  data: {
    user: {
      id: "usr_demo_admin",
      email: "admin@qacomics.local",
      displayName: "Demo Admin",
      role: "ADMIN",
    },
  },
};

function renderPath(path: string) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path],
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(<App queryClient={queryClient} router={router} />);

  return { router };
}

function authFlowFetchMock() {
  return vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = String(input);

    if (url === "/api/v1/auth/me") {
      return jsonResponse(unauthenticatedResponse, 401);
    }

    if (url === "/api/v1/auth/login" && init?.body) {
      const body = JSON.parse(String(init.body)) as {
        email: string;
        password: string;
      };

      if (
        body.email === "admin@qacomics.local" &&
        body.password === "DemoAdminPassphrase2026!"
      ) {
        return jsonResponse(demoAdminResponse);
      }

      if (
        body.email === "user@qacomics.local" &&
        body.password === "DemoUserPassphrase2026!"
      ) {
        return jsonResponse(demoUserResponse);
      }

      return jsonResponse(invalidCredentialsResponse, 401);
    }

    if (url === "/api/v1/auth/logout") {
      return new Response(null, { status: 204 });
    }

    if (url.includes("/filter-options")) {
      return jsonResponse(catalogFilterOptionsResponseFixture);
    }

    return jsonResponse(catalogListResponseFixture);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("frontend auth flow", () => {
  it("renders the localized English login route and validates fields", async () => {
    vi.stubGlobal("fetch", authFlowFetchMock());
    const user = userEvent.setup();
    renderPath("/en/login");

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "autocomplete",
      "username",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Enter a valid email address.")).toBeVisible();
    expect(screen.getByText("Enter a password.")).toBeVisible();
  });

  it("renders the localized Russian login route", async () => {
    vi.stubGlobal("fetch", authFlowFetchMock());
    renderPath("/ru/login");

    expect(await screen.findByRole("heading", { name: "Вход" })).toBeVisible();
    expect(screen.getByLabelText("Email")).toBeVisible();
    expect(screen.getByLabelText("Пароль")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "ru");
  });

  it("logs in a demo user, updates shell state, and returns to catalog", async () => {
    const fetchMock = authFlowFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { router } = renderPath("/en/login");

    await user.type(screen.getByLabelText("Email"), "USER@QACOMICS.LOCAL");
    await user.type(
      screen.getByLabelText("Password"),
      "DemoUserPassphrase2026!",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/en/comics");
    });
    expect(await screen.findByText("Signed in as Demo User")).toBeVisible();
    expect(screen.getByText("User")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        credentials: "same-origin",
        method: "POST",
      }),
    );
  });

  it("shows the admin role in shell state after admin login", async () => {
    vi.stubGlobal("fetch", authFlowFetchMock());
    const user = userEvent.setup();
    renderPath("/en/login");

    await user.type(screen.getByLabelText("Email"), "admin@qacomics.local");
    await user.type(
      screen.getByLabelText("Password"),
      "DemoAdminPassphrase2026!",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Signed in as Demo Admin")).toBeVisible();
    expect(screen.getByText("Admin")).toBeVisible();
  });

  it("shows generic invalid credentials copy", async () => {
    vi.stubGlobal("fetch", authFlowFetchMock());
    const user = userEvent.setup();
    renderPath("/en/login");

    await user.type(screen.getByLabelText("Email"), "user@qacomics.local");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
  });

  it("logs out from authenticated shell state", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);

      if (url === "/api/v1/auth/me") {
        return jsonResponse(demoUserResponse);
      }

      if (url === "/api/v1/auth/logout") {
        return new Response(null, { status: 204 });
      }

      if (url.includes("/filter-options")) {
        return jsonResponse(catalogFilterOptionsResponseFixture);
      }

      return jsonResponse(catalogListResponseFixture);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPath("/en/comics");

    expect(await screen.findByText("Signed in as Demo User")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("link", { name: "Sign in" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({
        credentials: "same-origin",
        method: "POST",
      }),
    );
  });
});
