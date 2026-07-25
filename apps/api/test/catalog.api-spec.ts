import { Logger, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { CatalogService } from "../src/catalog/catalog.service";
import type {
  CatalogDetailResponse,
  CatalogListResponse,
} from "../src/catalog/catalog.types";

describe("Catalog read API", () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  function httpServer() {
    if (!app) {
      throw new Error("Test application was not initialized.");
    }

    return app.getHttpServer();
  }

  it("returns only published comics in deterministic default order", async () => {
    const response = await request(httpServer())
      .get("/api/v1/comics")
      .expect("Content-Type", /json/)
      .expect(200);
    const body = response.body as CatalogListResponse;

    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 12,
      totalItems: 8,
      totalPages: 1,
    });
    expect(body.data.map((comic) => comic.slug)).toEqual([
      "neon-harbor-1",
      "neon-harbor-2",
      "clockwork-frontier-1",
      "clockwork-frontier-2",
      "last-tram-to-orbit",
      "paper-moon-protocol",
      "glass-signal",
      "iron-orchard",
    ]);
    expect(
      body.data.some((comic) => comic.slug === "neon-harbor-3"),
    ).toBe(false);
    expect(
      body.data.some((comic) => comic.slug === "ember-archive-1"),
    ).toBe(false);
    expect(
      body.data.every(
        (comic) =>
          !("id" in comic) &&
          !("publicationState" in comic) &&
          !("sortOrder" in comic),
      ),
    ).toBe(true);
  });

  it("applies page-based pagination", async () => {
    const response = await request(httpServer())
      .get("/api/v1/comics?page=2&pageSize=3")
      .expect(200);
    const body = response.body as CatalogListResponse;

    expect(body.pagination).toEqual({
      page: 2,
      pageSize: 3,
      totalItems: 8,
      totalPages: 3,
    });
    expect(body.data.map((comic) => comic.slug)).toEqual([
      "clockwork-frontier-2",
      "last-tram-to-orbit",
      "paper-moon-protocol",
    ]);

    const emptyResponse = await request(httpServer())
      .get("/api/v1/comics?page=20&pageSize=3")
      .expect(200);

    expect((emptyResponse.body as CatalogListResponse).data).toEqual(
      [],
    );
  });

  it("returns localized RU content with explicit effective locale", async () => {
    const response = await request(httpServer())
      .get("/api/v1/comics?locale=ru&pageSize=2")
      .expect(200);
    const body = response.body as CatalogListResponse;

    expect(body.data).toHaveLength(2);
    expect(body.data[0]?.contentLocale).toBe("ru");
    expect(body.data[0]?.title).not.toBe(
      "Neon Harbor: The Vanishing Beacon",
    );
    expect(body.data[0]?.series?.contentLocale).toBe("ru");
    expect(
      body.data[0]?.genres.every(
        (genre) => genre.contentLocale === "ru",
      ),
    ).toBe(true);
  });

  it("returns the detail DTO with deterministic relations", async () => {
    const response = await request(httpServer())
      .get("/api/v1/comics/neon-harbor-2")
      .expect(200);
    const body = response.body as CatalogDetailResponse;

    expect(body.data).toMatchObject({
      slug: "neon-harbor-2",
      sku: "QCG-NH-002",
      title: "Neon Harbor: Tides of Static",
      contentLocale: "en",
      series: {
        slug: "neon-harbor",
        title: "Neon Harbor",
        contentLocale: "en",
        issueNumber: 2,
      },
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
    });
    expect(body.data.description.length).toBeGreaterThan(0);
    expect(body.data.creators.map((creator) => creator.role)).toEqual([
      "WRITER",
      "ARTIST",
    ]);
    expect(body.data.genres.map((genre) => genre.slug)).toEqual([
      "adventure",
      "retro-futurism",
      "science-fiction",
    ]);
    expect(body.data).not.toHaveProperty("id");
    expect(body.data).not.toHaveProperty("publicationState");
    expect(body.data).not.toHaveProperty("sortOrder");
  });

  it("preserves valid out-of-stock and null-cover states", async () => {
    const outOfStock = await request(httpServer())
      .get("/api/v1/comics/clockwork-frontier-1")
      .expect(200);
    const nullCover = await request(httpServer())
      .get("/api/v1/comics/last-tram-to-orbit")
      .expect(200);

    expect(
      (outOfStock.body as CatalogDetailResponse).data.stock,
    ).toEqual({
      quantity: 0,
      inStock: false,
    });
    expect(
      (nullCover.body as CatalogDetailResponse).data.coverPath,
    ).toBeNull();
  });

  it.each([
    "neon-harbor-3",
    "ember-archive-1",
    "unknown-comic",
  ])("returns the same not-found error for %s", async (slug) => {
    await request(httpServer())
      .get(`/api/v1/comics/${slug}`)
      .expect(404)
      .expect({
        error: {
          code: "COMIC_NOT_FOUND",
          message: "Comic not found.",
          details: [],
        },
      });
  });

  it("returns deterministic validation errors", async () => {
    await request(httpServer())
      .get(
        "/api/v1/comics?page=0&pageSize=51&locale=fr&extra=value",
      )
      .expect("Content-Type", /json/)
      .expect(400)
      .expect({
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

    await request(httpServer())
      .get("/api/v1/comics/Bad_Slug")
      .expect(400)
      .expect({
        error: {
          code: "INVALID_REQUEST",
          message: "Request validation failed.",
          details: [
            {
              path: "slug",
              message: "Expected a valid comic slug.",
            },
          ],
        },
      });

    await request(httpServer())
      .get("/api/v1/comics?locale=en&locale=ru")
      .expect("Content-Type", /json/)
      .expect(400)
      .expect({
        error: {
          code: "INVALID_REQUEST",
          message: "Request validation failed.",
          details: [
            {
              path: "locale",
              message: "Expected one of: en, ru.",
            },
          ],
        },
      });

    for (const query of [
      "?page=1&page=2",
      "?pageSize=3&pageSize=4",
    ]) {
      const response = await request(httpServer())
        .get(`/api/v1/comics${query}`)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(Object.keys(response.body)).toEqual(["error"]);
      expect(Object.keys(response.body.error)).toEqual([
        "code",
        "message",
        "details",
      ]);
      expect(response.body.error.code).toBe("INVALID_REQUEST");
      expect(response.body.error.details.length).toBeGreaterThan(0);
    }
  });

  it("does not expose unexpected internal errors", async () => {
    if (!app) {
      throw new Error("Test application was not initialized.");
    }

    const catalogService = app.get(CatalogService);
    const loggerSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation();
    jest
      .spyOn(catalogService, "list")
      .mockRejectedValueOnce(new Error("private database detail"));

    try {
      const response = await request(httpServer())
        .get("/api/v1/comics")
        .expect(500)
        .expect({
          error: {
            code: "INTERNAL_ERROR",
            message: "Internal server error.",
            details: [],
          },
        });

      expect(JSON.stringify(response.body)).not.toContain(
        "private database detail",
      );
    } finally {
      loggerSpy.mockRestore();
    }
  });
});
