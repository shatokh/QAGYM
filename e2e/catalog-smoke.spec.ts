import { expect, test } from "@playwright/test";

test.describe("clean catalog browser smoke", () => {
  test("loads the English catalog through the real API page contract", async ({
    page,
  }) => {
    const catalogRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/comics?")) {
        catalogRequests.push(request.url());
      }
    });

    await page.goto("/en/comics");

    await expect(page.getByRole("heading", { name: "Comics catalog" })).toBeVisible();
    await expect(page.getByTestId("catalog-grid")).toBeVisible();
    await expect(page.getByTestId("catalog-grid").locator(":scope > li")).toHaveCount(6);

    const requestUrl = new URL(catalogRequests.at(-1) ?? "http://invalid");
    expect(requestUrl.searchParams.get("locale")).toBe("en");
    expect(requestUrl.searchParams.get("page")).toBe("1");
    expect(requestUrl.searchParams.get("pageSize")).toBe("6");
  });

  test("loads the Russian catalog with localized route and document language", async ({
    page,
  }) => {
    await page.goto("/ru/comics");

    await expect(page).toHaveURL(/\/ru\/comics$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("catalog-grid")).toBeVisible();
  });

  test("navigates between the two clean catalog pages", async ({ page }) => {
    await page.goto("/en/comics");
    await page.getByTestId("pagination-next").click();

    await expect(page).toHaveURL(/\/en\/comics\?page=2$/);
    await expect(page.getByTestId("catalog-grid").locator(":scope > li")).toHaveCount(2);
    await expect(page.getByTestId("pagination-previous")).toHaveAttribute(
      "href",
      "/en/comics",
    );

    await page.getByTestId("pagination-previous").click();
    await expect(page).toHaveURL(/\/en\/comics$/);
  });

  test("opens a stable-slug detail page and returns to the localized catalog", async ({
    page,
  }) => {
    await page.goto("/en/comics");
    await page.getByTestId("comic-card--neon-harbor-1").getByRole("link").click();

    await expect(page).toHaveURL(/\/en\/comics\/neon-harbor-1$/);
    await expect(
      page.getByRole("heading", { name: "Neon Harbor: The Vanishing Beacon" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Description" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to catalog" })).toHaveAttribute(
      "href",
      "/en/comics",
    );
  });

  test("canonicalizes an invalid page without requesting an invalid API page", async ({
    page,
  }) => {
    const catalogRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/comics?")) {
        catalogRequests.push(request.url());
      }
    });

    await page.goto("/en/comics?page=invalid");
    await expect(page).toHaveURL(/\/en\/comics$/);
    await expect(page.getByTestId("catalog-grid")).toBeVisible();

    expect(catalogRequests.length).toBeGreaterThan(0);
    expect(
      catalogRequests.every((requestUrl) => {
        const search = new URL(requestUrl).searchParams;
        return search.get("page") === "1";
      }),
    ).toBe(true);
  });

  test("searches by SKU and keeps the result in the localized URL", async ({
    page,
  }) => {
    await page.goto("/en/comics");
    await page.getByLabel("Search comics").fill("QCG-NH-002");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/en\/comics\?q=QCG-NH-002$/);
    await expect(page.getByTestId("catalog-grid").locator(":scope > li")).toHaveCount(1);
    await expect(page.getByTestId("comic-card--neon-harbor-2")).toBeVisible();
  });

  test("combines genre, series, and availability filters", async ({ page }) => {
    await page.goto("/en/comics");
    await page.getByLabel("Genre").selectOption("adventure");
    await page.getByLabel("Series").selectOption("clockwork-frontier");
    await page.getByLabel("Availability").selectOption("in-stock");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(
      /\/en\/comics\?genre=adventure&series=clockwork-frontier&availability=in-stock$/,
    );
    await expect(page.getByTestId("catalog-grid").locator(":scope > li")).toHaveCount(1);
    await expect(page.getByTestId("comic-card--clockwork-frontier-2")).toBeVisible();
  });

  test("preserves active filters through pagination and clears them", async ({ page }) => {
    await page.goto("/en/comics?availability=in-stock");
    await page.getByTestId("pagination-next").click();

    await expect(page).toHaveURL(/\/en\/comics\?availability=in-stock&page=2$/);
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/en\/comics$/);
  });

  test("supports RU search and exposes a distinct no-results state", async ({
    page,
  }) => {
    await page.goto("/ru/comics?q=QCG-NH-002");
    await expect(page.getByTestId("catalog-grid")).toBeVisible();
    await expect(page.getByTestId("comic-card--neon-harbor-2")).toBeVisible();

    await page.goto("/ru/comics?q=does-not-exist");
    await expect(page.getByTestId("catalog-empty")).toBeVisible();
  });

  test("keeps the catalog usable at the supported 390px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/comics");

    await expect(page.getByTestId("catalog-grid")).toBeVisible();
    const widths = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(widths.documentWidth).toBeLessThanOrEqual(widths.viewportWidth);
  });

  test("shows a deterministic catalog API failure state", async ({ page }) => {
    await page.route("**/api/v1/comics*", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/en/comics");

    await expect(page.getByTestId("catalog-error")).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});
