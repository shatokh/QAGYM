import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import {
  LOGIN_EMAIL_ATTEMPT_LIMIT,
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  SESSION_COOKIE_NAME,
} from "../src/auth/auth.constants";
import { LoginThrottleService } from "../src/auth/login-throttle.service";
import {
  createSessionToken,
  hashSessionToken,
} from "../src/auth/session-cookie";
import { PrismaService } from "../src/database/prisma.service";

const demoUser = {
  id: "usr_demo_user",
  email: "user@qacomics.local",
  displayName: "Demo User",
  role: "USER",
};

const demoAdmin = {
  id: "usr_demo_admin",
  email: "admin@qacomics.local",
  displayName: "Demo Admin",
  role: "ADMIN",
};

describe("Auth API", () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let throttle: LoginThrottleService | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    throttle = app.get(LoginThrottleService);
  });

  beforeEach(async () => {
    throttle?.resetForTesting();
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

  function login(
    email = "user@qacomics.local",
    password = "DemoUserPassphrase2026!",
  ) {
    return request(httpServer())
      .post("/api/v1/auth/login")
      .send({ email, password })
      .expect("Content-Type", /json/);
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

  async function createStoredSession(options: {
    publicId?: string;
    createdAt?: Date;
    expiresAt?: Date;
    lastSeenAt?: Date;
    revokedAt?: Date | null;
  } = {}): Promise<string> {
    const user = await db().user.findUniqueOrThrow({
      where: { publicId: options.publicId ?? "usr_demo_user" },
      select: { id: true },
    });
    const now = new Date();
    const token = createSessionToken();

    await db().session.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(token),
        createdAt: options.createdAt ?? now,
        expiresAt:
          options.expiresAt ??
          new Date(now.getTime() + SESSION_ABSOLUTE_TIMEOUT_SECONDS * 1000),
        lastSeenAt: options.lastSeenAt ?? now,
        revokedAt: options.revokedAt,
      },
    });

    return `${SESSION_COOKIE_NAME}=${token}`;
  }

  it("logs in the demo user and sets the local MVP session cookie", async () => {
    const response = await login().expect(200);

    expect(response.body).toEqual({
      data: {
        user: demoUser,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("password");
    expect(JSON.stringify(response.body)).not.toContain("token");

    const rawSetCookie = response.headers["set-cookie"];
    const setCookie = Array.isArray(rawSetCookie)
      ? rawSetCookie
      : [rawSetCookie];
    expect(setCookie[0]).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie[0]).toContain("Max-Age=28800");
    expect(setCookie[0]).toContain("Path=/");
    expect(setCookie[0]).toContain("HttpOnly");
    expect(setCookie[0]).toContain("SameSite=Lax");
    expect(setCookie[0]).not.toContain("Secure");

    const sessions = await db().session.findMany();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(sessions[0]?.tokenHash).not.toContain(
      sessionCookie(response).replace(`${SESSION_COOKIE_NAME}=`, ""),
    );
  });

  it("logs in the demo admin", async () => {
    const response = await login(
      "ADMIN@QACOMICS.LOCAL",
      "DemoAdminPassphrase2026!",
    ).expect(200);

    expect(response.body).toEqual({
      data: {
        user: demoAdmin,
      },
    });
  });

  it("returns the current user for a valid cookie", async () => {
    const loginResponse = await login().expect(200);

    await request(httpServer())
      .get("/api/v1/auth/me")
      .set("Cookie", sessionCookie(loginResponse))
      .expect(200)
      .expect({
        data: {
          user: demoUser,
        },
      });
  });

  it.each([
    ["missing", undefined],
    ["malformed", `${SESSION_COOKIE_NAME}=short`],
    ["unknown", `${SESSION_COOKIE_NAME}=${"A".repeat(32)}`],
  ])("returns UNAUTHENTICATED for a %s session", async (_name, cookie) => {
    const response = request(httpServer()).get("/api/v1/auth/me");
    if (cookie) {
      response.set("Cookie", cookie);
    }

    await response.expect(401).expect({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required.",
        details: [],
      },
    });
  });

  it.each([
    [
      "expired",
      {
        createdAt: new Date(Date.now() - 3000),
        expiresAt: new Date(Date.now() - 1000),
        lastSeenAt: new Date(Date.now() - 2000),
      },
    ],
    [
      "idle-expired",
      {
        lastSeenAt: new Date(Date.now() - 31 * 60 * 1000),
      },
    ],
    [
      "revoked",
      {
        createdAt: new Date(Date.now() - 1000),
        revokedAt: new Date(),
      },
    ],
  ])("returns UNAUTHENTICATED for a %s stored session", async (_name, data) => {
    const cookie = await createStoredSession(data);

    await request(httpServer())
      .get("/api/v1/auth/me")
      .set("Cookie", cookie)
      .expect(401)
      .expect({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
          details: [],
        },
      });
  });

  it("logs out idempotently and clears the cookie", async () => {
    const loginResponse = await login().expect(200);
    const cookie = sessionCookie(loginResponse);

    const firstLogout = await request(httpServer())
      .post("/api/v1/auth/logout")
      .set("Cookie", cookie)
      .send({})
      .expect(204);

    expect(firstLogout.text).toBe("");
    expect(firstLogout.headers["set-cookie"][0]).toContain(
      `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
    );

    await request(httpServer())
      .post("/api/v1/auth/logout")
      .send({})
      .expect(204);

    await request(httpServer())
      .get("/api/v1/auth/me")
      .set("Cookie", cookie)
      .expect(401);
  });

  it("returns the same invalid-credentials response for private login failures", async () => {
    const expected = {
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
        details: [],
      },
    };

    const unknownEmail = await login(
      "unknown@qacomics.local",
      "DemoUserPassphrase2026!",
    ).expect(401);
    const wrongPassword = await login(
      "user@qacomics.local",
      "wrong-password",
    ).expect(401);

    await db().user.update({
      where: { email: "user@qacomics.local" },
      data: { enabled: false },
    });
    const disabled = await login().expect(401);

    expect(unknownEmail.body).toEqual(expected);
    expect(wrongPassword.body).toEqual(expected);
    expect(disabled.body).toEqual(expected);
  });

  it("returns deterministic validation errors", async () => {
    await request(httpServer())
      .post("/api/v1/auth/login")
      .send({
        email: "not-an-email",
        password: "",
        extra: "value",
      })
      .expect(400)
      .expect({
        error: {
          code: "INVALID_REQUEST",
          message: "Request validation failed.",
          details: [
            {
              path: "email",
              message: "Expected a valid email address.",
            },
            {
              path: "extra",
              message: "Unknown body field.",
            },
            {
              path: "password",
              message: "Expected a non-empty string.",
            },
          ],
        },
      });

    await request(httpServer())
      .post("/api/v1/auth/login")
      .set("Content-Type", "text/plain")
      .send("email=user@qacomics.local")
      .expect(400)
      .expect({
        error: {
          code: "INVALID_REQUEST",
          message: "Request validation failed.",
          details: [
            {
              path: "contentType",
              message: "Expected application/json.",
            },
          ],
        },
      });
  });

  it("rate-limits repeated failed login attempts without bucket details", async () => {
    for (let index = 0; index < LOGIN_EMAIL_ATTEMPT_LIMIT; index += 1) {
      await login(
        "rate-limit@example.test",
        "wrong-password",
      ).expect(401);
    }

    await login("rate-limit@example.test", "wrong-password")
      .expect(429)
      .expect({
        error: {
          code: "AUTH_RATE_LIMITED",
          message: "Too many authentication attempts.",
          details: [],
        },
      });
  });
});
