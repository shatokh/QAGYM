import { PrismaService } from "../database/prisma.service";
import {
  CreatorRole,
  Locale,
} from "../generated/prisma/enums";
import { CatalogService } from "./catalog.service";

describe("CatalogService", () => {
  const fallbackRecord = {
    slug: "fallback-comic",
    sku: "QCG-FB-001",
    issueNumber: 2,
    priceMinor: 1499,
    compareAtPriceMinor: 1999,
    currencyCode: "USD",
    stockQuantity: 2,
    coverPath: null,
    translations: [
      {
        locale: Locale.en,
        title: "Fallback Comic",
        description: "English fallback description.",
      },
    ],
    series: {
      slug: "fallback-series",
      translations: [
        {
          locale: Locale.en,
          title: "Fallback Series",
        },
      ],
    },
    creators: [
      {
        role: CreatorRole.ARTIST,
        sortOrder: 0,
        creator: {
          slug: "artist-one",
          displayName: "Artist One",
        },
      },
      {
        role: CreatorRole.WRITER,
        sortOrder: 1,
        creator: {
          slug: "writer-two",
          displayName: "Writer Two",
        },
      },
      {
        role: CreatorRole.WRITER,
        sortOrder: 0,
        creator: {
          slug: "writer-one",
          displayName: "Writer One",
        },
      },
    ],
    genres: [
      {
        genre: {
          slug: "science-fiction",
          translations: [
            {
              locale: Locale.en,
              name: "Science Fiction",
            },
          ],
        },
      },
      {
        genre: {
          slug: "adventure",
          translations: [
            {
              locale: Locale.en,
              name: "Adventure",
            },
          ],
        },
      },
    ],
  };

  function createService() {
    const prisma = {
      comic: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([fallbackRecord]),
        findFirst: jest.fn().mockResolvedValue(fallbackRecord),
      },
    };

    return {
      prisma,
      service: new CatalogService(
        prisma as unknown as PrismaService,
      ),
    };
  }

  it("maps fallback locale, money, stock, and relation order", async () => {
    const { service } = createService();

    const response = await service.list({
      page: 1,
      pageSize: 12,
      locale: "ru",
    });

    expect(response).toEqual({
      data: [
        {
          slug: "fallback-comic",
          sku: "QCG-FB-001",
          title: "Fallback Comic",
          contentLocale: "en",
          series: {
            slug: "fallback-series",
            title: "Fallback Series",
            contentLocale: "en",
            issueNumber: 2,
          },
          creators: [
            {
              slug: "writer-one",
              displayName: "Writer One",
              role: "WRITER",
            },
            {
              slug: "writer-two",
              displayName: "Writer Two",
              role: "WRITER",
            },
            {
              slug: "artist-one",
              displayName: "Artist One",
              role: "ARTIST",
            },
          ],
          genres: [
            {
              slug: "adventure",
              name: "Adventure",
              contentLocale: "en",
            },
            {
              slug: "science-fiction",
              name: "Science Fiction",
              contentLocale: "en",
            },
          ],
          price: {
            amountMinor: 1499,
            currencyCode: "USD",
          },
          compareAtPrice: {
            amountMinor: 1999,
            currencyCode: "USD",
          },
          stock: {
            quantity: 2,
            inStock: true,
          },
          coverPath: null,
        },
      ],
      pagination: {
        page: 1,
        pageSize: 12,
        totalItems: 1,
        totalPages: 1,
      },
    });
  });

  it("uses the same not-found error for unavailable detail records", async () => {
    const { prisma, service } = createService();
    prisma.comic.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.detail("unknown-comic", { locale: "en" }),
    ).rejects.toMatchObject({
      status: 404,
    });
  });
});
