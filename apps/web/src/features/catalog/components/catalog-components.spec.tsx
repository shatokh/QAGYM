import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  catalogDetailResponseFixture,
  catalogFilterOptionsResponseFixture,
} from "../../../test/catalog-fixtures";
import { CatalogCover, resolveCoverPath } from "./CatalogCover";
import { ComicCard } from "./ComicCard";
import { ComicDetailContent } from "./ComicDetailContent";
import { CatalogDiscoveryControls } from "./CatalogDiscoveryControls";
import { formatMoney, PriceDisplay } from "./PriceDisplay";

describe("catalog presentation components", () => {
  function renderWithProviders(ui: React.ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  it("resolves a null cover to the deterministic local fallback", () => {
    expect(resolveCoverPath(null)).toBe("/media/comics/cover-fallback.png");
    expect(resolveCoverPath("/media/comics/example.png")).toBe(
      "/media/comics/example.png",
    );
  });

  it("falls back when a committed cover cannot be loaded", () => {
    render(
      <CatalogCover
        alt="Cover of Example"
        coverPath="media/comics/missing.png"
        variant="card"
      />,
    );

    const image = screen.getByRole("img", { name: "Cover of Example" });
    expect(image).toHaveAttribute("src", "/media/comics/missing.png");
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", "/media/comics/cover-fallback.png");
  });

  it("formats minor-unit money and exposes a comparison price", () => {
    expect(formatMoney(1299, "USD", "en")).toBe("$12.99");

    render(
      <PriceDisplay
        amountMinor={999}
        compareAtPrice={{ amountMinor: 1299, currencyCode: "USD" }}
        currencyCode="USD"
        locale="en"
      />,
    );

    expect(screen.getByText("$9.99")).toBeVisible();
    expect(screen.getByText("$12.99")).toHaveAttribute(
      "aria-label",
      "Previous price $12.99",
    );
  });

  it("renders card identity and detail fields through localized links", () => {
    const comic = {
      ...catalogDetailResponseFixture.data,
      compareAtPrice: { amountMinor: 1499, currencyCode: "USD" },
      stock: { quantity: 0, inStock: false },
      series: null,
      creators: [
        ...catalogDetailResponseFixture.data.creators,
        { slug: "ava-ross", displayName: "Ava Ross", role: "ARTIST" as const },
      ],
      genres: [
        ...catalogDetailResponseFixture.data.genres,
        { slug: "adventure", name: "Adventure", contentLocale: "en" as const },
      ],
    };

    renderWithProviders(
      <MemoryRouter initialEntries={["/en/comics"]}>
        <ul>
          <ComicCard comic={comic} locale="en" />
        </ul>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("comic-card--neon-harbor-1")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Neon Harbor: The Vanishing Beacon/ }),
    ).toHaveAttribute("href", "/en/comics/neon-harbor-1");
    expect(screen.getByText("Standalone")).toBeVisible();
    expect(screen.getByText("Out of stock")).toBeVisible();
    expect(screen.getByText("Mystery, Adventure")).toBeVisible();
  });

  it("renders all approved detail sections and creator roles", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/en/comics/neon-harbor-1"]}>
        <ComicDetailContent comic={catalogDetailResponseFixture.data} locale="en" />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("comic-detail--neon-harbor-1")).toBeVisible();
    expect(screen.getByText("Localized comic description.")).toBeVisible();
    expect(screen.getByText("Nora Vale")).toBeVisible();
    expect(screen.getByText("Writer")).toBeVisible();
    expect(screen.getByText("Mystery")).toBeVisible();
    expect(screen.getByText("SKU:")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to catalog" }),
    ).toHaveAttribute("href", "/en/comics");
  });

  it("submits and clears URL-addressable discovery state", () => {
    const onSubmit = vi.fn();
    const onClear = vi.fn();

    render(
      <CatalogDiscoveryControls
        filters={{
          q: "neon",
          genre: "mystery",
          series: "",
          availability: "",
        }}
        options={catalogFilterOptionsResponseFixture.data}
        optionsError={false}
        optionsPending={false}
        onClear={onClear}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "  neon harbor  " },
    });
    fireEvent.submit(screen.getByRole("searchbox").closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith({
      q: "neon harbor",
      genre: "mystery",
      series: "",
      availability: "",
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
