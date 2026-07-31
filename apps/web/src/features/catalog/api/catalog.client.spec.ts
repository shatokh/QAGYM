import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCatalogFilterOptions,
  getCatalogList,
  getComicDetail,
  type CatalogListRequest,
} from "./catalog.client";
import { CatalogApiError } from "./catalog.errors";
import {
  catalogDetailResponseFixture,
  catalogFilterOptionsResponseFixture,
  catalogListResponseFixture,
} from "../../../test/catalog-fixtures";

const listRequest: CatalogListRequest = {
  locale: "ru",
  page: 2,
  pageSize: 12,
};

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

describe("catalog API client", () => {
  it("builds a same-origin list request with every server input", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(catalogListResponseFixture));
    const controller = new AbortController();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCatalogList(listRequest, controller.signal)).resolves.toEqual(
      catalogListResponseFixture,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/comics?page=2&pageSize=12&locale=ru",
      {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    );
  });

  it("encodes detail slugs and validates the response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(catalogDetailResponseFixture));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getComicDetail({
        locale: "en",
        slug: "neon-harbor-1",
      }),
    ).resolves.toEqual(catalogDetailResponseFixture);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/comics/neon-harbor-1?locale=en",
      expect.any(Object),
    );
  });

  it("serializes discovery filters and validates filter options", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(catalogListResponseFixture))
      .mockResolvedValueOnce(jsonResponse(catalogFilterOptionsResponseFixture));
    vi.stubGlobal("fetch", fetchMock);

    await getCatalogList({
      ...listRequest,
      q: "neon harbor",
      genre: "mystery",
      series: "neon-harbor",
      availability: "in-stock",
    });
    await expect(getCatalogFilterOptions("en")).resolves.toEqual(
      catalogFilterOptionsResponseFixture,
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/comics?page=2&pageSize=12&locale=ru&q=neon+harbor&genre=mystery&series=neon-harbor&availability=in-stock",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/catalog/filter-options?locale=en",
      expect.any(Object),
    );
  });

  it("returns a typed HTTP error from the documented envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "COMIC_NOT_FOUND",
              message: "Comic not found.",
              details: [],
            },
          },
          404,
        ),
      ),
    );

    const error = await getComicDetail({
      locale: "en",
      slug: "missing-comic",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(CatalogApiError);
    expect(error).toMatchObject({
      code: "COMIC_NOT_FOUND",
      details: [],
      kind: "http",
      status: 404,
    });
  });

  it("rejects malformed successful responses as contract failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ data: [], pagination: {} })),
    );

    await expect(getCatalogList(listRequest)).rejects.toMatchObject({
      kind: "contract",
      status: 200,
    });
  });

  it("keeps cancellation distinct from network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockRejectedValue(new DOMException("Aborted", "AbortError")),
    );

    await expect(getCatalogList(listRequest)).rejects.toMatchObject({
      kind: "aborted",
      status: null,
    });
  });
});
