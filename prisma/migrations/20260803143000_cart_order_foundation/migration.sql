-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('PLACED', 'CANCELLED');

-- CreateTable
CREATE TABLE "carts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_lines" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "comic_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cart_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_number" VARCHAR(18) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'PLACED',
    "recipient_name" VARCHAR(120) NOT NULL,
    "address_line1" VARCHAR(160) NOT NULL,
    "address_line2" VARCHAR(160),
    "city" VARCHAR(120) NOT NULL,
    "region" VARCHAR(120),
    "postal_code" VARCHAR(32) NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "total_items" INTEGER NOT NULL,
    "total_amount_minor" INTEGER NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "comic_id" INTEGER,
    "comic_slug" VARCHAR(120) NOT NULL,
    "sku" VARCHAR(64) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content_locale" "locale" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_minor" INTEGER NOT NULL,
    "line_total_minor" INTEGER NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_lines_cart_id_comic_id_key" ON "cart_lines"("cart_id", "comic_id");

-- CreateIndex
CREATE INDEX "cart_lines_comic_id_idx" ON "cart_lines"("comic_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_id_idx" ON "orders"("user_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "order_lines_order_id_idx" ON "order_lines"("order_id");

-- CreateIndex
CREATE INDEX "order_lines_comic_id_idx" ON "order_lines"("comic_id");

-- AddCheckConstraints
ALTER TABLE "cart_lines"
    ADD CONSTRAINT "cart_lines_quantity_range_check"
        CHECK ("quantity" BETWEEN 1 AND 99);

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_order_number_format_check"
        CHECK ("order_number" ~ '^QCG-[0-9]{8}-[0-9]{4}$'),
    ADD CONSTRAINT "orders_recipient_name_not_blank_check"
        CHECK (btrim("recipient_name") <> ''),
    ADD CONSTRAINT "orders_address_line1_not_blank_check"
        CHECK (btrim("address_line1") <> ''),
    ADD CONSTRAINT "orders_address_line2_not_blank_check"
        CHECK ("address_line2" IS NULL OR btrim("address_line2") <> ''),
    ADD CONSTRAINT "orders_city_not_blank_check"
        CHECK (btrim("city") <> ''),
    ADD CONSTRAINT "orders_region_not_blank_check"
        CHECK ("region" IS NULL OR btrim("region") <> ''),
    ADD CONSTRAINT "orders_postal_code_not_blank_check"
        CHECK (btrim("postal_code") <> ''),
    ADD CONSTRAINT "orders_country_code_allowed_check"
        CHECK ("country_code" IN ('US', 'PL', 'GB')),
    ADD CONSTRAINT "orders_total_items_positive_check"
        CHECK ("total_items" > 0),
    ADD CONSTRAINT "orders_total_amount_minor_nonnegative_check"
        CHECK ("total_amount_minor" >= 0),
    ADD CONSTRAINT "orders_currency_code_format_check"
        CHECK ("currency_code" ~ '^[A-Z]{3}$');

ALTER TABLE "order_lines"
    ADD CONSTRAINT "order_lines_comic_slug_format_check"
        CHECK ("comic_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "order_lines_sku_format_check"
        CHECK ("sku" ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),
    ADD CONSTRAINT "order_lines_title_not_blank_check"
        CHECK (btrim("title") <> ''),
    ADD CONSTRAINT "order_lines_quantity_range_check"
        CHECK ("quantity" BETWEEN 1 AND 99),
    ADD CONSTRAINT "order_lines_unit_price_minor_nonnegative_check"
        CHECK ("unit_price_minor" >= 0),
    ADD CONSTRAINT "order_lines_line_total_minor_nonnegative_check"
        CHECK ("line_total_minor" >= 0),
    ADD CONSTRAINT "order_lines_line_total_matches_quantity_check"
        CHECK ("line_total_minor" = "unit_price_minor" * "quantity"),
    ADD CONSTRAINT "order_lines_currency_code_format_check"
        CHECK ("currency_code" ~ '^[A-Z]{3}$');

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
