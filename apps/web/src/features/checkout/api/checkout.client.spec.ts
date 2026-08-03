import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkout,
  getOrderDetail,
  getOrders,
} from "./checkout.client";
import { CheckoutApiError } from "./checkout.errors";
import {
  orderDetailResponseFixture,
  populatedOrderListResponseFixture,
} from "../../../test/order-fixtures";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkout and order API client", () => {
  it("obtains CSRF before checkout and sends the locale", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "csrf-token-value-123" } }))
      .mockResolvedValueOnce(jsonResponse(orderDetailResponseFixture));
    vi.stubGlobal("fetch", fetchMock);

    await checkout("ru", {
      address: {
        recipientName: "Demo User",
        addressLine1: "101 Test Loop",
        addressLine2: "Suite QA",
        city: "Testville",
        region: "CA",
        postalCode: "90001",
        countryCode: "US",
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/csrf-token",
      expect.objectContaining({
        credentials: "same-origin",
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/checkout?locale=ru",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-QCG-CSRF-Token": "csrf-token-value-123",
        }),
        method: "POST",
      }),
    );
  });

  it("reads order list and detail with same-origin credentials", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(populatedOrderListResponseFixture))
      .mockResolvedValueOnce(jsonResponse(orderDetailResponseFixture));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getOrders({ page: 2, pageSize: 12 })).resolves.toEqual(
      populatedOrderListResponseFixture,
    );
    await expect(getOrderDetail("QCG-20260803-0001")).resolves.toEqual(
      orderDetailResponseFixture,
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/orders?page=2&pageSize=12",
      expect.objectContaining({
        credentials: "same-origin",
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/orders/QCG-20260803-0001",
      expect.objectContaining({
        credentials: "same-origin",
        method: "GET",
      }),
    );
  });

  it("returns typed HTTP errors and rejects malformed success bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: "ORDER_NOT_FOUND",
              message: "Order not found.",
              details: [],
            },
          },
          404,
        ),
      ),
    );

    const error = await getOrderDetail("QCG-20260803-0001").catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(CheckoutApiError);
    expect(error).toMatchObject({
      code: "ORDER_NOT_FOUND",
      kind: "http",
      status: 404,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse({ data: {} })),
    );
    await expect(getOrders({ page: 1, pageSize: 12 })).rejects.toMatchObject({
      kind: "contract",
      status: 200,
    });
  });
});
