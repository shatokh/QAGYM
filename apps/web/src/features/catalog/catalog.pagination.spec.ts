import { describe, expect, it } from "vitest";
import {
  canonicalCatalogSearch,
  hasCatalogFilters,
  parseCatalogFilters,
  parseCatalogPage,
} from "./catalog.pagination";

describe("catalog pagination URL state", () => {
  it("accepts one positive integer page value", () => {
    expect(parseCatalogPage("?page=3")).toEqual({
      page: 3,
      shouldCanonicalize: false,
    });
  });

  it.each(["", "?page=0", "?page=-1", "?page=abc", "?page=1.5", "?page=1&page=2"])(
    "canonicalizes invalid page search %s",
    (search) => {
      expect(parseCatalogPage(search)).toEqual({
        page: 1,
        shouldCanonicalize: search !== "",
      });
    },
  );

  it("preserves unrelated query parameters while removing an invalid page", () => {
    expect(canonicalCatalogSearch("?sort=title&page=bad", 1)).toBe(
      "sort=title",
    );
  });

  it("writes page two without changing other query parameters", () => {
    expect(canonicalCatalogSearch("?sort=title", 2)).toBe(
      "sort=title&page=2",
    );
  });

  it("parses supported filters and canonicalizes whitespace", () => {
    expect(parseCatalogFilters("?q=%20neon%20harbor%20&genre=mystery&availability=in-stock")).toEqual({
      filters: {
        q: "neon harbor",
        genre: "mystery",
        series: "",
        availability: "in-stock",
      },
      shouldCanonicalize: true,
    });
  });

  it("drops invalid and repeated filter values", () => {
    expect(parseCatalogFilters("?availability=unknown&genre=mystery&genre=drama")).toEqual({
      filters: {
        q: "",
        genre: "",
        series: "",
        availability: "",
      },
      shouldCanonicalize: true,
    });
  });

  it("writes filters and reports whether discovery is active", () => {
    const filters = {
      q: "neon harbor",
      genre: "mystery",
      series: "",
      availability: "out-of-stock" as const,
    };

    expect(canonicalCatalogSearch("?page=3&sort=title", 1, filters)).toBe(
      "sort=title&q=neon+harbor&genre=mystery&availability=out-of-stock",
    );
    expect(hasCatalogFilters(filters)).toBe(true);
  });
});
