import { QueryClient } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { catalogListResponseFixture } from "../test/catalog-fixtures";
import { RouteErrorBoundary } from "../routing/RouteErrorBoundary";
import { appRoutes } from "./router";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

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

  return {
    queryClient,
    router,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("application routing", () => {
  it("redirects the root to the canonical English catalog", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse(catalogListResponseFixture)),
    );
    const { router } = renderPath("/");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/en/comics");
    });
    expect(
      await screen.findByRole("heading", {
        name: "Comics catalog",
      }),
    ).toBeVisible();
  });

  it("synchronizes the Russian route, UI language, and document language", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse(catalogListResponseFixture)),
    );
    renderPath("/ru/comics");

    expect(
      await screen.findByRole("heading", {
        name: "Каталог комиксов",
      }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "ru");
    expect(document.title).toBe("Каталог комиксов | QA Comics Gym");
    expect(
      screen.getByRole("link", {
        name: "RU",
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("preserves the route while switching locale", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(catalogListResponseFixture));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { router } = renderPath("/en/comics");

    await screen.findByTestId("catalog-grid");
    await user.click(
      screen.getByRole("link", {
        name: "RU",
      }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/ru/comics");
    });
    expect(
      await screen.findByRole("heading", {
        name: "Каталог комиксов",
      }),
    ).toBeVisible();
  });

  it("renders unsupported locales as not found without an API request", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    renderPath("/fr/comics");

    expect(
      await screen.findByRole("heading", {
        name: "Page not found",
      }),
    ).toBeVisible();
    expect(screen.getByTestId("route-not-found")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("exposes deterministic loading and populated grid states", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse(catalogListResponseFixture)),
    );
    renderPath("/en/comics");

    expect(screen.getByTestId("catalog-loading")).toHaveRole("status");
    expect(await screen.findByTestId("catalog-grid")).toBeVisible();
    expect(screen.queryByTestId("catalog-loading")).not.toBeInTheDocument();
  });

  it("renders route failures without exposing raw exception details", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/broken",
          loader: () => {
            throw new Error("Sensitive route detail");
          },
          element: <div>Unavailable content</div>,
          errorElement: <RouteErrorBoundary standalone />,
        },
      ],
      {
        initialEntries: ["/broken"],
      },
    );
    const queryClient = new QueryClient();

    render(<App queryClient={queryClient} router={router} />);

    expect(
      await screen.findByRole("heading", {
        name: "Something went wrong",
      }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.queryByText("Sensitive route detail")).not.toBeInTheDocument();
  });
});
