import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { SESSION_COOKIE_NAME } from "../src/auth/auth.constants";
import { CsrfTokenService } from "../src/cart/csrf-token.service";
import type { CartResponse } from "../src/cart/cart.types";
import { PrismaService } from "../src/database/prisma.service";

const invalidRequest = (details: Array<{ path: string; message: string }>) => ({
  error: {
    code: "INVALID_REQUEST",
    message: "Request validation failed.",
    details,
  },
});

const unauthenticated = {
  error: {
    code: "UNAUTHENTICATED",
    message: "Authentication required.",
    details: [],
  },
};

const forbidden = {
  error: {
    code: "FORBIDDEN",
    message: "Permission denied.",
    details: [],
  },
};

const csrfTokenInvalid = {
  error: {
    code: "CSRF_TOKEN_INVALID",
    message: "Invalid CSRF token.",
    details: [],
  },
};

describe("Cart and CSRF API", () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let csrfTokens: CsrfTokenService | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    csrfTokens = app.get(CsrfTokenService);
  });

  beforeEach(async () => {
    csrfTokens?.resetForTesting();
    await db().cartLine.deleteMany();
    await db().cart.deleteMany();
    await db().session.deleteMany();
    await db().user.updateMany({
      data: { enabled: true },
    });
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

  function db(): PrismaService {
    if (!prisma) {
      throw new Error("Prisma test client was not initialized.");
    }

    return prisma;
  }

  async function login(
    email = "user@qacomics.local",
    password = "DemoUserPassphrase2026!",
  ): Promise<string> {
    const response = await request(httpServer())
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect(200);

    return sessionCookie(response);
  }

  async function csrfToken(cookie: string): Promise<string> {
    const response = await request(httpServer())
      .get("/api/v1/csrf-token")
      .set("Cookie", cookie)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body.data.csrfToken).toMatch(/^[A-Za-z0-9_-]{40,}$/);

    return response.body.data.csrfToken;
  }

  function sessionCookie(response: request.Response): string {
    const header = response.headers["set-cookie"];
    const cookies = Array.isArray(header) ? header : [header];
    const cookie = cookies.find((value): value is string =>
      typeof value === "string" &&
      value.startsWith(`${SESSION_COOKIE_NAME}=`),
    );

    if (!cookie) {
      throw new Error("Session cookie was not set.");
    }

    return cookie.split(";")[0] ?? cookie;
  }

  it("issues a CSRF token for the demo user only", async () => {
    const userCookie = await login();
    await csrfToken(userCookie);

    const adminCookie = await login(
      "admin@qacomics.local",
      "DemoAdminPassphrase2026!",
    );

    await request(httpServer())
      .get("/api/v1/csrf-token")
      .set("Cookie", adminCookie)
      .expect(403)
      .expect(forbidden);
  });

  it("returns an empty cart for a seeded demo user without creating one", async () => {
    const cookie = await login();
    const response = await request(httpServer())
      .get("/api/v1/cart")
      .set("Cookie", cookie)
      .expect("Content-Type", /json/)
      .expect(200);
    const body = response.body as CartResponse;

    expect(body).toEqual({
      data: {
        cart: {
          items: [],
          totalItems: 0,
          subtotal: {
            amountMinor: 0,
            currencyCode: "USD",
          },
        },
      },
    });
    expect(await db().cart.count()).toBe(0);
  });

  it("protects buyer cart routes from guests and admins", async () => {
    await request(httpServer())
      .get("/api/v1/cart")
      .expect(401)
      .expect(unauthenticated);

    const adminCookie = await login(
      "admin@qacomics.local",
      "DemoAdminPassphrase2026!",
    );

    await request(httpServer())
      .get("/api/v1/cart")
      .set("Cookie", adminCookie)
      .expect(403)
      .expect(forbidden);
  });

  it("rejects cart mutations without a valid CSRF token", async () => {
    const cookie = await login();

    await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .send({ comicSlug: "neon-harbor-1", quantity: 1 })
      .expect(403)
      .expect(csrfTokenInvalid);

    await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", "invalid-token")
      .send({ comicSlug: "neon-harbor-1", quantity: 1 })
      .expect(403)
      .expect(csrfTokenInvalid);
  });

  it("adds published comics and merges duplicate lines", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);

    const first = await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ comicSlug: "neon-harbor-1", quantity: 1 })
      .expect(200);
    expect(first.body.data.cart.items).toHaveLength(1);
    expect(first.body.data.cart.items[0]).toMatchObject({
      comicSlug: "neon-harbor-1",
      sku: "QCG-NH-001",
      title: "Neon Harbor: The Vanishing Beacon",
      contentLocale: "en",
      quantity: 1,
      unitPrice: {
        amountMinor: 1299,
        currencyCode: "USD",
      },
      lineTotal: {
        amountMinor: 1299,
        currencyCode: "USD",
      },
      stock: {
        quantity: 24,
        inStock: true,
      },
      coverPath: "media/comics/neon-harbor-1.png",
    });

    const second = await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ comicSlug: "neon-harbor-1", quantity: 2 })
      .expect(200);

    expect(second.body.data.cart).toMatchObject({
      totalItems: 3,
      subtotal: {
        amountMinor: 3897,
        currencyCode: "USD",
      },
    });
    expect(second.body.data.cart.items).toHaveLength(1);
    expect(second.body.data.cart.items[0].quantity).toBe(3);
    expect(JSON.stringify(second.body)).not.toContain("token");
    expect(JSON.stringify(second.body)).not.toContain("password");
    expect(JSON.stringify(second.body)).not.toContain("publicationState");
    expect(await db().cartLine.count()).toBe(1);
  });

  it("updates and removes cart lines", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);

    await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ comicSlug: "neon-harbor-1", quantity: 2 })
      .expect(200);

    const updated = await request(httpServer())
      .patch("/api/v1/cart/lines/neon-harbor-1")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ quantity: 4 })
      .expect(200);
    expect(updated.body.data.cart.items[0].quantity).toBe(4);
    expect(updated.body.data.cart.totalItems).toBe(4);

    await request(httpServer())
      .delete("/api/v1/cart/lines/neon-harbor-1")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .expect(204)
      .expect("");

    await request(httpServer())
      .delete("/api/v1/cart/lines/neon-harbor-1")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .expect(204)
      .expect("");

    const empty = await request(httpServer())
      .get("/api/v1/cart")
      .set("Cookie", cookie)
      .expect(200);
    expect(empty.body.data.cart.items).toEqual([]);
  });

  it("returns deterministic add and stock errors", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);

    for (const slug of [
      "unknown-comic",
      "neon-harbor-3",
      "ember-archive-1",
      "clockwork-frontier-1",
    ]) {
      await request(httpServer())
        .post("/api/v1/cart/lines")
        .set("Cookie", cookie)
        .set("X-QCG-CSRF-Token", token)
        .send({ comicSlug: slug, quantity: 1 })
        .expect(404)
        .expect({
          error: {
            code: "COMIC_NOT_FOUND",
            message: "Comic not found.",
            details: [],
          },
        });
    }

    await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ comicSlug: "neon-harbor-2", quantity: 3 })
      .expect(409)
      .expect({
        error: {
          code: "INSUFFICIENT_STOCK",
          message: "Insufficient stock.",
          details: [],
        },
      });
  });

  it("returns CART_LINE_NOT_FOUND when updating a valid absent line", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);

    await request(httpServer())
      .patch("/api/v1/cart/lines/neon-harbor-1")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ quantity: 1 })
      .expect(404)
      .expect({
        error: {
          code: "CART_LINE_NOT_FOUND",
          message: "Cart line not found.",
          details: [],
        },
      });
  });

  it("localizes read DTOs without changing write route query contracts", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);

    await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ comicSlug: "neon-harbor-1", quantity: 1 })
      .expect(200);

    const localized = await request(httpServer())
      .get("/api/v1/cart?locale=ru")
      .set("Cookie", cookie)
      .expect(200);
    expect(localized.body.data.cart.items[0]).toMatchObject({
      comicSlug: "neon-harbor-1",
      contentLocale: "ru",
    });
    expect(localized.body.data.cart.items[0].title).not.toBe(
      "Neon Harbor: The Vanishing Beacon",
    );

    await request(httpServer())
      .post("/api/v1/cart/lines?locale=ru")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ comicSlug: "neon-harbor-1", quantity: 1 })
      .expect(400)
      .expect(invalidRequest([
        {
          path: "locale",
          message: "Unknown query parameter.",
        },
      ]));
  });

  it("returns deterministic validation errors", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);

    await request(httpServer())
      .get("/api/v1/cart?locale=en&locale=ru")
      .set("Cookie", cookie)
      .expect(400)
      .expect(invalidRequest([
        {
          path: "locale",
          message: "Expected one of: en, ru.",
        },
      ]));

    await request(httpServer())
      .get("/api/v1/csrf-token?extra=value")
      .set("Cookie", cookie)
      .expect(400)
      .expect(invalidRequest([
        {
          path: "extra",
          message: "Unknown query parameter.",
        },
      ]));

    await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({
        comicSlug: "Bad_Slug",
        quantity: 0,
        extra: "value",
      })
      .expect(400)
      .expect(invalidRequest([
        {
          path: "comicSlug",
          message: "Expected a valid comic slug.",
        },
        {
          path: "extra",
          message: "Unknown body field.",
        },
        {
          path: "quantity",
          message: "Expected an integer from 1 to 99.",
        },
      ]));

    await request(httpServer())
      .patch("/api/v1/cart/lines/Bad_Slug")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ quantity: 1 })
      .expect(400)
      .expect(invalidRequest([
        {
          path: "slug",
          message: "Expected a valid comic slug.",
        },
      ]));
  });
});
