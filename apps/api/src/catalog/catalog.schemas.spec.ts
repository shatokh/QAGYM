import { ApiException } from "../http/api-exception";
import {
  parseCatalogDetailQuery,
  parseCatalogListQuery,
  parseComicSlug,
} from "./catalog.schemas";

describe("catalog request schemas", () => {
  it("applies clean list defaults", () => {
    expect(parseCatalogListQuery({})).toEqual({
      page: 1,
      pageSize: 12,
      locale: "en",
    });
  });

  it("parses explicit list values", () => {
    expect(
      parseCatalogListQuery({
        page: "2",
        pageSize: "3",
        locale: "ru",
      }),
    ).toEqual({
      page: 2,
      pageSize: 3,
      locale: "ru",
    });
  });

  it("parses discovery filters and trims search", () => {
    expect(
      parseCatalogListQuery({
        q: "  NEON  ",
        genre: "science-fiction",
        series: "neon-harbor",
        availability: "in-stock",
      }),
    ).toEqual({
      page: 1,
      pageSize: 12,
      locale: "en",
      q: "NEON",
      genre: "science-fiction",
      series: "neon-harbor",
      availability: "in-stock",
    });
  });

  it("returns deterministic validation details", () => {
    expect(() =>
      parseCatalogListQuery({
        page: "0",
        pageSize: "51",
        locale: "fr",
        extra: "value",
      }),
    ).toThrow(ApiException);

    try {
      parseCatalogListQuery({
        page: "0",
        pageSize: "51",
        locale: "fr",
        extra: "value",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiException);
      expect((error as ApiException).getResponse()).toEqual({
        error: {
          code: "INVALID_REQUEST",
          message: "Request validation failed.",
          details: [
            {
              path: "extra",
              message: "Unknown query parameter.",
            },
            {
              path: "locale",
              message: "Expected one of: en, ru.",
            },
            {
              path: "page",
              message: "Expected a positive integer.",
            },
            {
              path: "pageSize",
              message: "Expected an integer from 1 to 50.",
            },
          ],
        },
      });
    }
  });

  it("validates detail locale and comic slug", () => {
    expect(parseCatalogDetailQuery({ locale: "ru" })).toEqual({
      locale: "ru",
    });
    expect(parseComicSlug("neon-harbor-1")).toBe("neon-harbor-1");
    expect(() => parseComicSlug("Bad_Slug")).toThrow(ApiException);
  });
});
