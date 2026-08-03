import { PrismaService } from "../src/database/prisma.service";

describe("Cart and order persistence seed", () => {
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

  it("starts cart and order scenario tables empty after deterministic seed reset", async () => {
    const rows = await db().$queryRaw<
      Array<{
        carts_count: bigint;
        cart_lines_count: bigint;
        orders_count: bigint;
        order_lines_count: bigint;
      }>
    >`
      SELECT
        (SELECT COUNT(*)::BIGINT FROM "carts") AS "carts_count",
        (SELECT COUNT(*)::BIGINT FROM "cart_lines") AS "cart_lines_count",
        (SELECT COUNT(*)::BIGINT FROM "orders") AS "orders_count",
        (SELECT COUNT(*)::BIGINT FROM "order_lines") AS "order_lines_count"
    `;

    expect(rows).toEqual([
      {
        carts_count: 0n,
        cart_lines_count: 0n,
        orders_count: 0n,
        order_lines_count: 0n,
      },
    ]);
  });

  it("creates the planned order status enum values", async () => {
    const rows = await db().$queryRaw<Array<{ enumlabel: string }>>`
      SELECT "enumlabel"
      FROM "pg_enum"
      JOIN "pg_type" ON "pg_type"."oid" = "pg_enum"."enumtypid"
      WHERE "pg_type"."typname" = 'order_status'
      ORDER BY "pg_enum"."enumsortorder" ASC
    `;

    expect(rows.map((row) => row.enumlabel)).toEqual([
      "PLACED",
      "CANCELLED",
    ]);
  });

  it("installs cart and order persistence indexes required by the clean contract", async () => {
    const rows = await db().$queryRaw<Array<{ indexname: string }>>`
      SELECT "indexname"
      FROM "pg_indexes"
      WHERE "schemaname" = 'public'
        AND "indexname" IN (
          'carts_user_id_key',
          'cart_lines_cart_id_comic_id_key',
          'cart_lines_comic_id_idx',
          'orders_order_number_key',
          'orders_user_id_created_at_id_idx',
          'order_lines_order_id_idx',
          'order_lines_comic_id_idx'
        )
      ORDER BY "indexname" ASC
    `;

    expect(rows.map((row) => row.indexname)).toEqual([
      "cart_lines_cart_id_comic_id_key",
      "cart_lines_comic_id_idx",
      "carts_user_id_key",
      "order_lines_comic_id_idx",
      "order_lines_order_id_idx",
      "orders_order_number_key",
      "orders_user_id_created_at_id_idx",
    ]);
  });

  it("installs cart and order persistence checks required by the clean contract", async () => {
    const rows = await db().$queryRaw<Array<{ conname: string }>>`
      SELECT "conname"
      FROM "pg_constraint"
      WHERE "conname" IN (
        'cart_lines_quantity_range_check',
        'orders_order_number_format_check',
        'orders_country_code_allowed_check',
        'orders_total_items_positive_check',
        'orders_total_amount_minor_nonnegative_check',
        'orders_currency_code_format_check',
        'order_lines_comic_slug_format_check',
        'order_lines_sku_format_check',
        'order_lines_title_not_blank_check',
        'order_lines_quantity_range_check',
        'order_lines_line_total_matches_quantity_check',
        'order_lines_currency_code_format_check'
      )
      ORDER BY "conname" ASC
    `;

    expect(rows.map((row) => row.conname)).toEqual([
      "cart_lines_quantity_range_check",
      "order_lines_comic_slug_format_check",
      "order_lines_currency_code_format_check",
      "order_lines_line_total_matches_quantity_check",
      "order_lines_quantity_range_check",
      "order_lines_sku_format_check",
      "order_lines_title_not_blank_check",
      "orders_country_code_allowed_check",
      "orders_currency_code_format_check",
      "orders_order_number_format_check",
      "orders_total_amount_minor_nonnegative_check",
      "orders_total_items_positive_check",
    ]);
  });
});
