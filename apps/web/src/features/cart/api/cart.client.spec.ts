import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addCartLine,
  getCart,
  removeCartLine,
  updateCartLine,
} from "./cart.client";
import { CartApiError } from "./cart.errors";
import {
  emptyCartResponseFixture,
  populatedCartResponseFixture,
} from "../../../test/cart-fixtures";

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

describe("cart API client", () => {
  it("reads the localized cart with same-origin credentials", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(emptyCartResponseFixture));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCart("ru")).resolves.toEqual(emptyCartResponseFixture);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/cart?locale=ru",
      expect.objectContaining({
        credentials: "same-origin",
        method: "GET",
      }),
    );
  });

  it("obtains CSRF before adding and updating cart lines", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "csrf-token-value-123" } }))
      .mockResolvedValueOnce(jsonResponse(populatedCartResponseFixture))
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "csrf-token-value-456" } }))
      .mockResolvedValueOnce(jsonResponse(populatedCartResponseFixture));
    vi.stubGlobal("fetch", fetchMock);

    await addCartLine({ comicSlug: "neon-harbor-1", quantity: 1 });
    await updateCartLine({ comicSlug: "neon-harbor-1", quantity: 2 });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/csrf-token",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/cart/lines",
      expect.objectContaining({
        body: JSON.stringify({ comicSlug: "neon-harbor-1", quantity: 1 }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-QCG-CSRF-Token": "csrf-token-value-123",
        }),
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/v1/cart/lines/neon-harbor-1",
      expect.objectContaining({
        body: JSON.stringify({ quantity: 2 }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-QCG-CSRF-Token": "csrf-token-value-456",
        }),
        method: "PATCH",
      }),
    );
  });

  it("sends CSRF for idempotent removal", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ data: { csrfToken: "csrf-token-value-789" } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(removeCartLine("neon-harbor-1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/cart/lines/neon-harbor-1",
      expect.objectContaining({
        headers: {
          "X-QCG-CSRF-Token": "csrf-token-value-789",
        },
        method: "DELETE",
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
              code: "FORBIDDEN",
              message: "Permission denied.",
              details: [],
            },
          },
          403,
        ),
      ),
    );

    const error = await getCart("en").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(CartApiError);
    expect(error).toMatchObject({
      code: "FORBIDDEN",
      kind: "http",
      status: 403,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse({ data: {} })),
    );
    await expect(getCart("en")).rejects.toMatchObject({
      kind: "contract",
      status: 200,
    });
  });
});
