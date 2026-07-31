import { describe, expect, it } from "vitest";
import { catalogQueryKeys } from "./catalog.queries";

describe("catalog query keys", () => {
  it("includes locale, pagination, and filters in list identity", () => {
    expect(
      catalogQueryKeys.list({
        locale: "ru",
        page: 3,
        pageSize: 24,
      }),
    ).toEqual(["catalog", "list", "ru", 3, 24, "", "", "", ""]);
  });

  it("includes locale and slug in detail identity", () => {
    expect(
      catalogQueryKeys.detail({
        locale: "en",
        slug: "neon-harbor-1",
      }),
    ).toEqual(["catalog", "detail", "en", "neon-harbor-1"]);
  });
});
