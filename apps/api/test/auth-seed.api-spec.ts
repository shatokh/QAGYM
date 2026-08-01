import { PrismaService } from "../src/database/prisma.service";

type DemoUserRow = {
  public_id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: "USER" | "ADMIN";
  enabled: boolean;
};

describe("Auth seed", () => {
  let prisma: PrismaService | undefined;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  function db(): PrismaService {
    if (!prisma) {
      throw new Error("Prisma test client was not initialized.");
    }

    return prisma;
  }

  it("creates exactly the two enabled demo accounts from the internal contract", async () => {
    const users = await db().$queryRaw<DemoUserRow[]>`
      SELECT
        "public_id",
        "email",
        "password_hash",
        "display_name",
        "role"::TEXT AS "role",
        "enabled"
      FROM "users"
      ORDER BY "public_id" ASC
    `;

    expect(users).toEqual([
      {
        public_id: "usr_demo_admin",
        email: "admin@qacomics.local",
        password_hash: expect.stringMatching(
          /^\$argon2id\$v=19\$m=19456,(t=2,p=1|p=1,t=2)\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/,
        ),
        display_name: "Demo Admin",
        role: "ADMIN",
        enabled: true,
      },
      {
        public_id: "usr_demo_user",
        email: "user@qacomics.local",
        password_hash: expect.stringMatching(
          /^\$argon2id\$v=19\$m=19456,(t=2,p=1|p=1,t=2)\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/,
        ),
        display_name: "Demo User",
        role: "USER",
        enabled: true,
      },
    ]);
  });

  it("stores password hashes without plaintext demo passwords", async () => {
    const rows = await db().$queryRaw<Array<{ password_hash: string }>>`
      SELECT "password_hash"
      FROM "users"
      ORDER BY "public_id" ASC
    `;

    expect(rows.map((row) => row.password_hash)).not.toContain(
      "DemoUserPassphrase2026!",
    );
    expect(rows.map((row) => row.password_hash)).not.toContain(
      "DemoAdminPassphrase2026!",
    );
    expect(
      rows.every((row) => row.password_hash.length > 80),
    ).toBe(true);
  });

  it("does not create preexisting sessions", async () => {
    const rows = await db().$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::BIGINT AS "count"
      FROM "sessions"
    `;

    expect(rows[0]?.count).toBe(0n);
  });
});
