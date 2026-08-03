import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { SESSION_COOKIE_NAME } from "../src/auth/auth.constants";
import { CsrfTokenService } from "../src/cart/csrf-token.service";
import { PrismaService } from "../src/database/prisma.service";
import { PublicationState } from "../src/generated/prisma/enums";

const checkoutAddress = {
  recipientName: "Demo User",
  addressLine1: "101 Test Loop",
  addressLine2: "Suite QA",
  city: "Testville",
  region: "CA",
  postalCode: "90001",
  countryCode: "US",
};

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

describe("Checkout and order history API", () => {
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
    await resetMutableState();
  });

  afterEach(async () => {
    await resetMutableState();
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

  async function resetMutableState(): Promise<void> {
    csrfTokens?.resetForTesting();
    await db().orderLine.deleteMany();
    await db().order.deleteMany();
    await db().cartLine.deleteMany();
    await db().cart.deleteMany();
    await db().session.deleteMany();
    await db().user.updateMany({
      data: { enabled: true },
    });
    await db().comic.update({
      where: { slug: "neon-harbor-1" },
      data: {
        publicationState: PublicationState.PUBLISHED,
        stockQuantity: 24,
      },
    });
    await db().comic.update({
      where: { slug: "neon-harbor-2" },
      data: {
        publicationState: PublicationState.PUBLISHED,
        stockQuantity: 2,
      },
    });
    await db().comic.update({
      where: { slug: "clockwork-frontier-1" },
      data: {
        publicationState: PublicationState.PUBLISHED,
        stockQuantity: 0,
      },
    });
    await db().comic.update({
      where: { slug: "neon-harbor-3" },
      data: {
        publicationState: PublicationState.DRAFT,
        stockQuantity: 10,
      },
    });
    await db().comic.update({
      where: { slug: "ember-archive-1" },
      data: {
        publicationState: PublicationState.ARCHIVED,
        stockQuantity: 4,
      },
    });
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
      .expect(200);

    return response.body.data.csrfToken;
  }

  async function addCartLine(
    cookie: string,
    token: string,
    comicSlug: string,
    quantity: number,
  ): Promise<void> {
    await request(httpServer())
      .post("/api/v1/cart/lines")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ comicSlug, quantity })
      .expect(200);
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

  it("checks out a populated cart and snapshots localized order details", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);
    await addCartLine(cookie, token, "neon-harbor-1", 2);

    const response = await request(httpServer())
      .post("/api/v1/checkout?locale=ru")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ address: checkoutAddress })
      .expect("Content-Type", /json/)
      .expect(201);
    const order = response.body.data.order;

    expect(order).toMatchObject({
      orderNumber: expect.stringMatching(/^QCG-[0-9]{8}-[0-9]{4}$/),
      status: "PLACED",
      address: checkoutAddress,
      totalItems: 2,
      total: {
        amountMinor: 2598,
        currencyCode: "USD",
      },
    });
    expect(order.createdAt).toMatch(
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T.+Z$/,
    );
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      comicSlug: "neon-harbor-1",
      sku: "QCG-NH-001",
      contentLocale: "ru",
      quantity: 2,
      unitPrice: {
        amountMinor: 1299,
        currencyCode: "USD",
      },
      lineTotal: {
        amountMinor: 2598,
        currencyCode: "USD",
      },
    });
    expect(order.items[0].title).not.toBe(
      "Neon Harbor: The Vanishing Beacon",
    );
    expect(JSON.stringify(response.body)).not.toContain("password");
    expect(JSON.stringify(response.body)).not.toContain("token");
    expect(JSON.stringify(response.body)).not.toContain("publicationState");

    await request(httpServer())
      .get("/api/v1/cart")
      .set("Cookie", cookie)
      .expect(200)
      .expect({
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

    const comic = await db().comic.findUniqueOrThrow({
      where: { slug: "neon-harbor-1" },
      select: { stockQuantity: true },
    });
    expect(comic.stockQuantity).toBe(22);
    expect(await db().order.count()).toBe(1);
    expect(await db().orderLine.count()).toBe(1);
  });

  it("protects checkout and order routes by auth, role, and CSRF", async () => {
    await request(httpServer())
      .get("/api/v1/orders")
      .expect(401)
      .expect(unauthenticated);

    await request(httpServer())
      .post("/api/v1/checkout")
      .send({ address: checkoutAddress })
      .expect(401)
      .expect(unauthenticated);

    const adminCookie = await login(
      "admin@qacomics.local",
      "DemoAdminPassphrase2026!",
    );

    await request(httpServer())
      .get("/api/v1/orders")
      .set("Cookie", adminCookie)
      .expect(403)
      .expect(forbidden);

    await request(httpServer())
      .post("/api/v1/checkout")
      .set("Cookie", adminCookie)
      .set("X-QCG-CSRF-Token", "irrelevant")
      .send({ address: checkoutAddress })
      .expect(403)
      .expect(forbidden);

    const cookie = await login();
    await request(httpServer())
      .post("/api/v1/checkout")
      .set("Cookie", cookie)
      .send({ address: checkoutAddress })
      .expect(403)
      .expect(csrfTokenInvalid);
  });

  it("rejects empty carts without creating an order", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);

    await request(httpServer())
      .post("/api/v1/checkout")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ address: checkoutAddress })
      .expect(409)
      .expect({
        error: {
          code: "CART_EMPTY",
          message: "Cart is empty.",
          details: [],
        },
      });
    expect(await db().order.count()).toBe(0);
  });

  it("keeps cart and stock unchanged when checkout stock is insufficient", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);
    await addCartLine(cookie, token, "neon-harbor-2", 2);
    await db().comic.update({
      where: { slug: "neon-harbor-2" },
      data: { stockQuantity: 1 },
    });

    await request(httpServer())
      .post("/api/v1/checkout")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ address: checkoutAddress })
      .expect(409)
      .expect({
        error: {
          code: "INSUFFICIENT_STOCK",
          message: "Insufficient stock.",
          details: [],
        },
      });

    expect(await db().order.count()).toBe(0);
    expect(await db().cartLine.count()).toBe(1);
    const comic = await db().comic.findUniqueOrThrow({
      where: { slug: "neon-harbor-2" },
      select: { stockQuantity: true },
    });
    expect(comic.stockQuantity).toBe(1);
  });

  it("keeps cart and stock unchanged when a cart line becomes non-purchasable", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);
    await addCartLine(cookie, token, "neon-harbor-1", 1);
    await db().comic.update({
      where: { slug: "neon-harbor-1" },
      data: { publicationState: PublicationState.DRAFT },
    });

    await request(httpServer())
      .post("/api/v1/checkout")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ address: checkoutAddress })
      .expect(404)
      .expect({
        error: {
          code: "COMIC_NOT_FOUND",
          message: "Comic not found.",
          details: [],
        },
      });

    expect(await db().order.count()).toBe(0);
    expect(await db().cartLine.count()).toBe(1);
    const comic = await db().comic.findUniqueOrThrow({
      where: { slug: "neon-harbor-1" },
      select: { stockQuantity: true },
    });
    expect(comic.stockQuantity).toBe(24);
  });

  it("lists and reads only the authenticated user's orders", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);
    await addCartLine(cookie, token, "neon-harbor-1", 1);
    const first = await request(httpServer())
      .post("/api/v1/checkout")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ address: checkoutAddress })
      .expect(201);

    await addCartLine(cookie, token, "neon-harbor-2", 1);
    const second = await request(httpServer())
      .post("/api/v1/checkout")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ address: checkoutAddress })
      .expect(201);

    const admin = await db().user.findUniqueOrThrow({
      where: { publicId: "usr_demo_admin" },
      select: { id: true },
    });
    await db().order.create({
      data: {
        orderNumber: "QCG-20260803-9999",
        userId: admin.id,
        recipientName: "Admin",
        addressLine1: "1 Admin Way",
        city: "Admin City",
        postalCode: "10000",
        countryCode: "US",
        totalItems: 1,
        totalAmountMinor: 100,
        currencyCode: "USD",
      },
    });

    const list = await request(httpServer())
      .get("/api/v1/orders?page=1&pageSize=1")
      .set("Cookie", cookie)
      .expect(200);
    expect(list.body.pagination).toEqual({
      page: 1,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2,
    });
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({
      orderNumber: second.body.data.order.orderNumber,
      status: "PLACED",
      totalItems: 1,
      total: {
        amountMinor: 1499,
        currencyCode: "USD",
      },
    });
    expect(list.body.data[0]).not.toHaveProperty("address");
    expect(list.body.data[0]).not.toHaveProperty("items");

    const detail = await request(httpServer())
      .get(`/api/v1/orders/${first.body.data.order.orderNumber}`)
      .set("Cookie", cookie)
      .expect(200);
    expect(detail.body.data.order).toMatchObject({
      orderNumber: first.body.data.order.orderNumber,
      address: checkoutAddress,
      totalItems: 1,
    });

    await request(httpServer())
      .get("/api/v1/orders/QCG-20260803-9999")
      .set("Cookie", cookie)
      .expect(404)
      .expect({
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Order not found.",
          details: [],
        },
      });

    await request(httpServer())
      .get("/api/v1/orders/QCG-20990101-0001")
      .set("Cookie", cookie)
      .expect(404)
      .expect({
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Order not found.",
          details: [],
        },
      });
  });

  it("returns deterministic checkout and order validation errors", async () => {
    const cookie = await login();
    const token = await csrfToken(cookie);

    await request(httpServer())
      .post("/api/v1/checkout?locale=en&locale=ru")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({ address: checkoutAddress })
      .expect(400)
      .expect(invalidRequest([
        {
          path: "locale",
          message: "Expected one of: en, ru.",
        },
      ]));

    await request(httpServer())
      .post("/api/v1/checkout")
      .set("Cookie", cookie)
      .set("X-QCG-CSRF-Token", token)
      .send({
        address: {
          recipientName: "",
          addressLine1: "",
          city: "",
          postalCode: "",
          countryCode: "DE",
          extra: "value",
        },
        extra: "value",
      })
      .expect(400)
      .expect(invalidRequest([
        {
          path: "address.addressLine1",
          message: "Expected a string from 1 to 160 characters.",
        },
        {
          path: "address.city",
          message: "Expected a string from 1 to 120 characters.",
        },
        {
          path: "address.countryCode",
          message: "Expected one of: US, PL, GB.",
        },
        {
          path: "address.extra",
          message: "Unknown body field.",
        },
        {
          path: "address.postalCode",
          message: "Expected a string from 1 to 32 characters.",
        },
        {
          path: "address.recipientName",
          message: "Expected a string from 1 to 120 characters.",
        },
        {
          path: "extra",
          message: "Unknown body field.",
        },
      ]));

    await request(httpServer())
      .get("/api/v1/orders?page=0&pageSize=51&extra=value")
      .set("Cookie", cookie)
      .expect(400)
      .expect(invalidRequest([
        {
          path: "extra",
          message: "Unknown query parameter.",
        },
        {
          path: "page",
          message: "Expected a positive integer.",
        },
        {
          path: "pageSize",
          message: "Expected an integer from 1 to 50.",
        },
      ]));

    await request(httpServer())
      .get("/api/v1/orders/QCG-bad")
      .set("Cookie", cookie)
      .expect(400)
      .expect(invalidRequest([
        {
          path: "orderNumber",
          message: "Expected a valid order number.",
        },
      ]));
  });
});
