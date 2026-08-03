import { QueryClient } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../App";
import { appRoutes } from "../../app/router";
import {
  catalogDetailResponseFixture,
  catalogFilterOptionsResponseFixture,
  catalogListResponseFixture,
} from "../../test/catalog-fixtures";
import {
  emptyCartResponseFixture,
  populatedCartResponseFixture,
} from "../../test/cart-fixtures";

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

const adminResponse = {
  data: {
    user: {
      id: "usr_demo_admin",
      email: "admin@qacomics.local",
      displayName: "Demo Admin",
      role: "ADMIN",
    },
  },
};

const unauthenticatedResponse = {
  error: {
    code: "UNAUTHENTICATED",
    message: "Authentication required.",
    details: [],
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

function cartFetchMock(currentUser: unknown = userResponse) {
  let cart = emptyCartResponseFixture;

  return vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = String(input);

    if (url === "/api/v1/auth/me") {
      return currentUser === null
        ? jsonResponse(unauthenticatedResponse, 401)
        : jsonResponse(currentUser);
    }

    if (url.includes("/filter-options")) {
      return jsonResponse(catalogFilterOptionsResponseFixture);
    }

    if (url.startsWith("/api/v1/comics/neon-harbor-1")) {
      return jsonResponse(catalogDetailResponseFixture);
    }

    if (url.startsWith("/api/v1/comics")) {
      return jsonResponse(catalogListResponseFixture);
    }

    if (url === "/api/v1/csrf-token") {
      return jsonResponse({ data: { csrfToken: "csrf-token-value-123" } });
    }

    if (url === "/api/v1/cart/lines") {
      cart = populatedCartResponseFixture;
      return jsonResponse(populatedCartResponseFixture);
    }

    if (url === "/api/v1/cart/lines/neon-harbor-1" && init?.method === "PATCH") {
      cart = populatedCartResponseFixture;
      return jsonResponse(populatedCartResponseFixture);
    }

    if (url === "/api/v1/cart/lines/neon-harbor-1" && init?.method === "DELETE") {
      cart = emptyCartResponseFixture;
      return new Response(null, { status: 204 });
    }

    if (url.startsWith("/api/v1/cart")) {
      return jsonResponse(cart);
    }

    return jsonResponse(catalogListResponseFixture);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("frontend cart flow", () => {
  it("renders guest and admin cart boundaries", async () => {
    vi.stubGlobal("fetch", cartFetchMock(null));
    renderPath("/en/cart");

    expect(
      await screen.findByRole("heading", { name: "Your cart" }),
    ).toBeVisible();
    const signInBoundary = await screen.findByTestId("cart-sign-in-required");
    expect(signInBoundary).toBeVisible();
    expect(within(signInBoundary).getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/en/login",
    );

    vi.unstubAllGlobals();
    cleanup();
    vi.stubGlobal("fetch", cartFetchMock(adminResponse));
    renderPath("/en/cart");
    expect(await screen.findByTestId("cart-forbidden")).toBeVisible();
  });

  it("adds a catalog comic and opens the populated cart", async () => {
    const fetchMock = cartFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { router } = renderPath("/en/comics");

    await screen.findByTestId("catalog-grid");
    await user.click(screen.getByTestId("add-to-cart--neon-harbor-1"));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/cart/lines",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-QCG-CSRF-Token": "csrf-token-value-123",
          }),
          method: "POST",
        }),
      );
    });

    await user.click(screen.getByRole("link", { name: "Cart" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/en/cart");
    });
    expect(await screen.findByTestId("cart-populated")).toBeVisible();
    expect(screen.getByTestId("cart-item--neon-harbor-1")).toBeVisible();
    expect(screen.getAllByText("$25.98")).toHaveLength(2);
    expect(screen.queryByText("usr_demo_user")).not.toBeInTheDocument();
    expect(screen.queryByText("csrf-token-value-123")).not.toBeInTheDocument();
  });

  it("updates and removes cart lines from the cart route", async () => {
    const fetchMock = cartFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPath("/en/cart");

    expect(await screen.findByTestId("cart-empty")).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Back to catalog" }));
    await screen.findByTestId("catalog-grid");
    await user.click(screen.getByTestId("add-to-cart--neon-harbor-1"));
    await user.click(screen.getByRole("link", { name: "Cart" }));

    const item = await screen.findByTestId("cart-item--neon-harbor-1");
    fireEvent.change(within(item).getByLabelText(/Quantity for/), {
      target: { value: "3" },
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/cart/lines/neon-harbor-1",
        expect.objectContaining({
          body: JSON.stringify({ quantity: 3 }),
          method: "PATCH",
        }),
      );
    });

    await user.click(within(item).getByRole("button", { name: "Remove" }));
    expect(await screen.findByTestId("cart-empty")).toBeVisible();
  });

  it("renders Russian cart copy and disables out-of-stock add actions", async () => {
    const outOfStockCatalog = {
      ...catalogListResponseFixture,
      data: [
        {
          ...catalogListResponseFixture.data[0],
          stock: {
            quantity: 0,
            inStock: false,
          },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = String(input);
        if (url === "/api/v1/auth/me") return jsonResponse(userResponse);
        if (url.startsWith("/api/v1/cart")) return jsonResponse(emptyCartResponseFixture);
        if (url.includes("/filter-options")) {
          return jsonResponse(catalogFilterOptionsResponseFixture);
        }
        return jsonResponse(outOfStockCatalog);
      }),
    );
    renderPath("/ru/comics");

    expect(
      await screen.findByRole("heading", { name: "Каталог комиксов" }),
    ).toBeVisible();
    expect(await screen.findByTestId("add-to-cart--neon-harbor-1")).toBeDisabled();
    expect(screen.getByTestId("add-to-cart--neon-harbor-1")).toHaveTextContent(
      "Недоступно",
    );
  });
});
