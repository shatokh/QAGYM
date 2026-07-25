import { describe, expect, it } from "vitest";
import {
  canonicalCatalogSearch,
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
});
