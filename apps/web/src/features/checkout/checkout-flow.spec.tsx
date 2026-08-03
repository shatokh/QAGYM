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
  emptyCartResponseFixture,
  populatedCartResponseFixture,
} from "../../test/cart-fixtures";
import {
  emptyOrderListResponseFixture,
  orderDetailResponseFixture,
  populatedOrderListResponseFixture,
} from "../../test/order-fixtures";

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

function checkoutFetchMock(
  currentUser: unknown = userResponse,
  options: {
    cart?: unknown;
    orderList?: unknown;
    orderDetail?: unknown;
  } = {},
) {
  return vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = String(input);

    if (url === "/api/v1/auth/me") {
      return currentUser === null
        ? jsonResponse(unauthenticatedResponse, 401)
        : jsonResponse(currentUser);
    }

    if (url.startsWith("/api/v1/cart")) {
      return jsonResponse(options.cart ?? populatedCartResponseFixture);
    }

    if (url === "/api/v1/csrf-token") {
      return jsonResponse({ data: { csrfToken: "csrf-token-value-123" } });
    }

    if (url.startsWith("/api/v1/checkout") && init?.method === "POST") {
      return jsonResponse(orderDetailResponseFixture, 201);
    }

    if (url === "/api/v1/orders?page=1&pageSize=12") {
      return jsonResponse(options.orderList ?? populatedOrderListResponseFixture);
    }

    if (url === "/api/v1/orders/QCG-20260803-0001") {
      return jsonResponse(options.orderDetail ?? orderDetailResponseFixture);
    }

    return jsonResponse({ data: [] });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("frontend checkout and order flow", () => {
  it("renders guest and admin checkout boundaries", async () => {
    vi.stubGlobal("fetch", checkoutFetchMock(null));
    renderPath("/en/checkout");

    const signInBoundary = await screen.findByTestId("checkout-sign-in-required");
    expect(signInBoundary).toBeVisible();
    expect(within(signInBoundary).getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/en/login",
    );

    vi.unstubAllGlobals();
    cleanup();
    vi.stubGlobal("fetch", checkoutFetchMock(adminResponse));
    renderPath("/en/checkout");
    expect(await screen.findByTestId("checkout-forbidden")).toBeVisible();
  });

  it("validates checkout address, submits with CSRF, and opens order detail", async () => {
    const fetchMock = checkoutFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { router } = renderPath("/en/checkout");

    expect(await screen.findByTestId("checkout-ready")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Place order" }));
    expect(screen.getAllByText("Enter a value within the allowed length.")).toHaveLength(4);

    await user.type(screen.getByLabelText("Recipient name"), "Demo User");
    await user.type(screen.getByLabelText("Address line 1"), "101 Test Loop");
    await user.type(screen.getByLabelText("Address line 2"), "Suite QA");
    await user.type(screen.getByLabelText("City"), "Testville");
    await user.type(screen.getByLabelText("Region"), "CA");
    await user.type(screen.getByLabelText("Postal code"), "90001");
    await user.selectOptions(screen.getByLabelText("Country"), "US");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/checkout?locale=en",
        expect.objectContaining({
          body: JSON.stringify({
            address: {
              recipientName: "Demo User",
              addressLine1: "101 Test Loop",
              addressLine2: "Suite QA",
              city: "Testville",
              region: "CA",
              postalCode: "90001",
              countryCode: "US",
            },
          }),
          headers: expect.objectContaining({
            "X-QCG-CSRF-Token": "csrf-token-value-123",
          }),
          method: "POST",
        }),
      );
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/en/orders/QCG-20260803-0001");
    });
    expect(await screen.findByTestId("order-detail--QCG-20260803-0001")).toBeVisible();
    expect(screen.getByText("101 Test Loop")).toBeVisible();
    expect(screen.queryByText("usr_demo_user")).not.toBeInTheDocument();
    expect(screen.queryByText("csrf-token-value-123")).not.toBeInTheDocument();
  });

  it("blocks checkout when the cart is empty", async () => {
    vi.stubGlobal(
      "fetch",
      checkoutFetchMock(userResponse, {
        cart: emptyCartResponseFixture,
      }),
    );
    renderPath("/en/checkout");

    expect(await screen.findByTestId("checkout-empty-cart")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Place order" })).not.toBeInTheDocument();
  });

  it("renders populated order history and order detail links", async () => {
    vi.stubGlobal("fetch", checkoutFetchMock());
    const user = userEvent.setup();
    const { router } = renderPath("/en/orders");

    expect(await screen.findByTestId("orders-list")).toBeVisible();
    expect(screen.getByTestId("order-card--QCG-20260803-0001")).toBeVisible();
    await user.click(screen.getByRole("link", { name: "QCG-20260803-0001" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/en/orders/QCG-20260803-0001");
    });
    expect(await screen.findByTestId("order-line--neon-harbor-1")).toBeVisible();
    expect(screen.getAllByText("$25.98")).toHaveLength(2);
  });

  it("renders empty, not-found, and localized order states", async () => {
    vi.stubGlobal(
      "fetch",
      checkoutFetchMock(userResponse, {
        orderList: emptyOrderListResponseFixture,
      }),
    );
    renderPath("/ru/orders");

    expect(
      await screen.findByRole("heading", { name: "История заказов" }),
    ).toBeVisible();
    expect(await screen.findByTestId("orders-empty")).toBeVisible();

    vi.unstubAllGlobals();
    cleanup();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const url = String(input);
        if (url === "/api/v1/auth/me") return jsonResponse(userResponse);
        if (url === "/api/v1/orders/QCG-20990101-9999") {
          return jsonResponse(
            {
              error: {
                code: "ORDER_NOT_FOUND",
                message: "Order not found.",
                details: [],
              },
            },
            404,
          );
        }
        return jsonResponse(emptyOrderListResponseFixture);
      }),
    );
    renderPath("/en/orders/QCG-20990101-9999");

    expect(await screen.findByTestId("order-not-found")).toBeVisible();
  });

  it("links to checkout from the populated cart and exposes orders navigation", async () => {
    vi.stubGlobal("fetch", checkoutFetchMock());
    const user = userEvent.setup();
    const { router } = renderPath("/en/cart");

    expect(await screen.findByTestId("cart-populated")).toBeVisible();
    await user.click(screen.getByRole("link", { name: "Checkout" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/en/checkout");
    });

    fireEvent.click(screen.getByRole("link", { name: "Orders" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/en/orders");
    });
  });
});
