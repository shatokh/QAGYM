-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "public_id" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddCheckConstraints
ALTER TABLE "users"
    ADD CONSTRAINT "users_public_id_format_check"
        CHECK ("public_id" ~ '^usr_[a-z0-9]+(_[a-z0-9]+)*$'),
    ADD CONSTRAINT "users_email_normalized_check"
        CHECK (
            btrim("email") = "email"
            AND "email" = lower("email")
            AND "email" ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
        ),
    ADD CONSTRAINT "users_password_hash_not_blank_check"
        CHECK (btrim("password_hash") <> ''),
    ADD CONSTRAINT "users_display_name_not_blank_check"
        CHECK (btrim("display_name") <> '');

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_token_hash_not_blank_check"
        CHECK (btrim("token_hash") <> ''),
    ADD CONSTRAINT "sessions_expires_after_created_check"
        CHECK ("expires_at" > "created_at"),
    ADD CONSTRAINT "sessions_last_seen_not_after_expires_check"
        CHECK ("last_seen_at" <= "expires_at"),
    ADD CONSTRAINT "sessions_revoked_not_before_created_check"
        CHECK ("revoked_at" IS NULL OR "revoked_at" >= "created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
