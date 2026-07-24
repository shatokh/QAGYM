-- CreateEnum
CREATE TYPE "locale" AS ENUM ('en', 'ru');

-- CreateEnum
CREATE TYPE "publication_state" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "creator_role" AS ENUM ('WRITER', 'ARTIST');

-- CreateTable
CREATE TABLE "comics" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "sku" VARCHAR(64) NOT NULL,
    "series_id" INTEGER,
    "issue_number" INTEGER,
    "price_minor" INTEGER NOT NULL,
    "compare_at_price_minor" INTEGER,
    "currency_code" CHAR(3) NOT NULL,
    "stock_quantity" INTEGER NOT NULL,
    "publication_state" "publication_state" NOT NULL DEFAULT 'DRAFT',
    "cover_path" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "comics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comic_translations" (
    "comic_id" INTEGER NOT NULL,
    "locale" "locale" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "comic_translations_pkey" PRIMARY KEY ("comic_id","locale")
);

-- CreateTable
CREATE TABLE "series" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_translations" (
    "series_id" INTEGER NOT NULL,
    "locale" "locale" NOT NULL,
    "title" VARCHAR(160) NOT NULL,

    CONSTRAINT "series_translations_pkey" PRIMARY KEY ("series_id","locale")
);

-- CreateTable
CREATE TABLE "creators" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comic_creators" (
    "comic_id" INTEGER NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "role" "creator_role" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "comic_creators_pkey" PRIMARY KEY ("comic_id","creator_id","role")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre_translations" (
    "genre_id" INTEGER NOT NULL,
    "locale" "locale" NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "genre_translations_pkey" PRIMARY KEY ("genre_id","locale")
);

-- CreateTable
CREATE TABLE "comic_genres" (
    "comic_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "comic_genres_pkey" PRIMARY KEY ("comic_id","genre_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comics_slug_key" ON "comics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "comics_sku_key" ON "comics"("sku");

-- CreateIndex
CREATE INDEX "comics_publication_state_sort_order_id_idx" ON "comics"("publication_state", "sort_order", "id");

-- CreateIndex
CREATE UNIQUE INDEX "comics_series_id_issue_number_key" ON "comics"("series_id", "issue_number");

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "creators_slug_key" ON "creators"("slug");

-- CreateIndex
CREATE INDEX "comic_creators_creator_id_idx" ON "comic_creators"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE INDEX "comic_genres_genre_id_idx" ON "comic_genres"("genre_id");

-- AddCheckConstraints
ALTER TABLE "comics"
    ADD CONSTRAINT "comics_slug_format_check"
        CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "comics_sku_format_check"
        CHECK ("sku" ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),
    ADD CONSTRAINT "comics_currency_code_format_check"
        CHECK ("currency_code" ~ '^[A-Z]{3}$'),
    ADD CONSTRAINT "comics_price_minor_nonnegative_check"
        CHECK ("price_minor" >= 0),
    ADD CONSTRAINT "comics_compare_at_price_check"
        CHECK (
            "compare_at_price_minor" IS NULL
            OR "compare_at_price_minor" > "price_minor"
        ),
    ADD CONSTRAINT "comics_stock_quantity_nonnegative_check"
        CHECK ("stock_quantity" >= 0),
    ADD CONSTRAINT "comics_sort_order_nonnegative_check"
        CHECK ("sort_order" >= 0),
    ADD CONSTRAINT "comics_series_issue_consistency_check"
        CHECK (
            (
                "series_id" IS NULL
                AND "issue_number" IS NULL
            )
            OR (
                "series_id" IS NOT NULL
                AND "issue_number" IS NOT NULL
                AND "issue_number" > 0
            )
        );

ALTER TABLE "comic_translations"
    ADD CONSTRAINT "comic_translations_title_not_blank_check"
        CHECK (btrim("title") <> ''),
    ADD CONSTRAINT "comic_translations_description_not_blank_check"
        CHECK (btrim("description") <> '');

ALTER TABLE "series"
    ADD CONSTRAINT "series_slug_format_check"
        CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

ALTER TABLE "series_translations"
    ADD CONSTRAINT "series_translations_title_not_blank_check"
        CHECK (btrim("title") <> '');

ALTER TABLE "creators"
    ADD CONSTRAINT "creators_slug_format_check"
        CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT "creators_display_name_not_blank_check"
        CHECK (btrim("display_name") <> '');

ALTER TABLE "comic_creators"
    ADD CONSTRAINT "comic_creators_sort_order_nonnegative_check"
        CHECK ("sort_order" >= 0);

ALTER TABLE "genres"
    ADD CONSTRAINT "genres_slug_format_check"
        CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

ALTER TABLE "genre_translations"
    ADD CONSTRAINT "genre_translations_name_not_blank_check"
        CHECK (btrim("name") <> '');

-- AddForeignKey
ALTER TABLE "comics" ADD CONSTRAINT "comics_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_translations" ADD CONSTRAINT "comic_translations_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_translations" ADD CONSTRAINT "series_translations_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_creators" ADD CONSTRAINT "comic_creators_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_creators" ADD CONSTRAINT "comic_creators_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genre_translations" ADD CONSTRAINT "genre_translations_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_genres" ADD CONSTRAINT "comic_genres_comic_id_fkey" FOREIGN KEY ("comic_id") REFERENCES "comics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comic_genres" ADD CONSTRAINT "comic_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
