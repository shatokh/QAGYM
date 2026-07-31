import type {
  CatalogFilterOptionsResponse,
  CatalogDetailResponse,
  CatalogListResponse,
} from "../features/catalog/api/catalog.contract";

export const catalogFilterOptionsResponseFixture: CatalogFilterOptionsResponse = {
  data: {
    genres: [
      { slug: "adventure", name: "Adventure", contentLocale: "en" },
      { slug: "mystery", name: "Mystery", contentLocale: "en" },
    ],
    series: [
      { slug: "clockwork-frontier", name: "Clockwork Frontier", contentLocale: "en" },
      { slug: "neon-harbor", name: "Neon Harbor", contentLocale: "en" },
    ],
  },
};

export const catalogListResponseFixture: CatalogListResponse = {
  data: [
    {
      slug: "neon-harbor-1",
      sku: "QCG-NH-001",
      title: "Neon Harbor: The Vanishing Beacon",
      contentLocale: "en",
      series: {
        slug: "neon-harbor",
        title: "Neon Harbor",
        contentLocale: "en",
        issueNumber: 1,
      },
      creators: [
        {
          slug: "nora-vale",
          displayName: "Nora Vale",
          role: "WRITER",
        },
      ],
      genres: [
        {
          slug: "mystery",
          name: "Mystery",
          contentLocale: "en",
        },
      ],
      price: {
        amountMinor: 1299,
        currencyCode: "USD",
      },
      compareAtPrice: null,
      stock: {
        quantity: 24,
        inStock: true,
      },
      coverPath: "media/comics/neon-harbor-1.png",
    },
  ],
  pagination: {
    page: 1,
    pageSize: 12,
    totalItems: 8,
    totalPages: 1,
  },
};

export const catalogDetailResponseFixture: CatalogDetailResponse = {
  data: {
    ...catalogListResponseFixture.data[0],
    description: "Localized comic description.",
  },
};
