# Task 0012: Catalog Domain Schema and Initial Migration

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24.
- Approved scope notes: All four recommended schema decisions were accepted:
  closed EN/RU locale enum, comprehensive PostgreSQL check constraints,
  explicit snake_case database mapping, and deferred Prisma Client setup.

Do not start implementation while the approval record remains pending.

## Behavior Type

Clean Feature

The schema and migration directly represent the first clean product domain and
are explicitly included in this task.

## Background

Task `0011` established the clean catalog domain before implementation. The
current Prisma foundation has a PostgreSQL datasource but no product models,
generator, migrations, seed data, or API database integration.

This task should turn the approved catalog entities and invariants into the
first real Prisma schema and a reviewable PostgreSQL migration. It must not
introduce catalog data or application behavior.

Relevant references:

- `docs/product/catalog.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/tasks/0011-phase-1-catalog-foundation-plan.md`
- `docs/adr/ADR-0002-postgres-prisma.md`
- `AGENTS.md`

## Goal

Create the normalized clean catalog database structure and prove that its first
migration applies successfully to the supported local PostgreSQL runtime.

## Proposed Schema Decisions

These decisions become scope-locked only after human approval.

### Naming and Mapping

- Keep Prisma model and field names in idiomatic PascalCase and camelCase.
- Map PostgreSQL tables and columns explicitly to snake_case.
- Use plural table names:
  - `comics`
  - `comic_translations`
  - `series`
  - `series_translations`
  - `creators`
  - `comic_creators`
  - `genres`
  - `genre_translations`
  - `comic_genres`
- Give custom PostgreSQL constraints stable descriptive names in the migration.

### Enums

Add:

- `Locale`: `en`, `ru`.
- `PublicationState`: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- `CreatorRole`: `WRITER`, `ARTIST`.

Locale is intentionally closed to EN and RU for the MVP. Adding another locale
requires a later migration.

### Primary Entities

Add `Comic` with:

- `id`: auto-incrementing integer primary key.
- `slug`: unique `varchar(120)`.
- `sku`: unique `varchar(64)`.
- `seriesId`: nullable integer foreign key.
- `issueNumber`: nullable integer.
- `priceMinor`: integer.
- `compareAtPriceMinor`: nullable integer.
- `currencyCode`: `char(3)`.
- `stockQuantity`: integer.
- `publicationState`: enum, default `DRAFT`.
- `coverPath`: nullable `varchar(255)`.
- `sortOrder`: integer, default `0`.
- `createdAt`: timezone-aware timestamp, default current time.
- `updatedAt`: timezone-aware timestamp managed through Prisma.

Add `Series` with:

- `id`: auto-incrementing integer primary key.
- `slug`: unique `varchar(120)`.
- `createdAt` and `updatedAt`: timezone-aware timestamps.

Add `Creator` with:

- `id`: auto-incrementing integer primary key.
- `slug`: unique `varchar(120)`.
- `displayName`: `varchar(160)`.
- `createdAt` and `updatedAt`: timezone-aware timestamps.

Add `Genre` with:

- `id`: auto-incrementing integer primary key.
- `slug`: unique `varchar(80)`.
- `createdAt` and `updatedAt`: timezone-aware timestamps.

Use `timestamptz(3)` for all domain timestamps.

### Translations

Add:

- `ComicTranslation` with `comicId`, `locale`, `title varchar(200)`, and
  required text `description`.
- `SeriesTranslation` with `seriesId`, `locale`, and `title varchar(160)`.
- `GenreTranslation` with `genreId`, `locale`, and `name varchar(80)`.

Each translation table uses its parent ID plus locale as a composite primary
key. Do not add surrogate translation IDs or translation timestamps.

Schema structure can guarantee translation uniqueness but cannot guarantee that
every parent has both locales. EN/RU completeness remains a seed integrity rule
for task `0013`.

### Join Models

Add:

- `ComicCreator` with `comicId`, `creatorId`, `role`, and non-negative
  `sortOrder` defaulting to `0`.
- `ComicGenre` with `comicId` and `genreId`.

Use composite primary keys:

- `ComicCreator`: comic, creator, and role.
- `ComicGenre`: comic and genre.

Do not add surrogate join IDs or timestamps.

### Relationships and Delete Behavior

- Deleting a comic cascades to its translations and join rows.
- Deleting a series cascades to its translations but is restricted while a
  comic references it.
- Deleting a creator or genre cascades to its translations where applicable
  and is restricted while a comic join row references it.
- Updating referenced integer IDs cascades.

Application deletion workflows remain out of scope. These actions only protect
relational integrity.

### Uniqueness and Indexes

Add:

- Unique comic slug and SKU.
- Unique series, creator, and genre slug within each entity type.
- Unique series and issue-number pair.
- Composite primary keys described above.
- Public catalog read index on comic publication state, sort order, and ID.
- Reverse relation indexes for comic series, creator credits, and genre joins
  where they are not already covered by a primary or unique index.

Do not add search, full-text, price-filter, or analytics indexes before those
queries exist.

### PostgreSQL Check Constraints

Create the migration with Prisma Migrate `--create-only`, review the generated
SQL, and add checks that Prisma Schema Language cannot express.

Enforce:

- All slugs are non-empty lowercase ASCII segments separated by single hyphens.
- Comic SKU is non-empty uppercase ASCII letters and digits separated by
  single hyphens.
- Currency code is exactly three uppercase ASCII letters.
- Price is non-negative.
- Comparison price is null or greater than current price.
- Stock and all sort orders are non-negative.
- A standalone comic has neither series nor issue number.
- A series comic has both a series and a positive issue number.
- Required titles, descriptions, creator display names, and genre names are not
  blank after trimming.

The migration SQL is part of the reviewed source of truth. Do not replace these
checks with application-only validation.

## Scope

- Update `prisma/schema.prisma` with the approved enums, models, relations,
  native PostgreSQL types, mappings, indexes, defaults, and uniqueness rules.
- Create the first migration under `prisma/migrations/` with a stable
  `catalog_foundation` name.
- Customize the generated migration SQL with the approved PostgreSQL check
  constraints before applying it.
- Commit Prisma migration metadata produced by the CLI.
- Apply the migration to the existing local Docker Compose PostgreSQL service.
- Update catalog and architecture documentation to record implemented schema
  decisions and remove resolved schema questions.
- Update `docs/local-development.md` with the actual local migration commands.
- Update `PROGRESS.md` and this task with implementation and verification
  results.

## Out of Scope

- Prisma Client generator or generated client.
- `@prisma/client`, PostgreSQL driver, or Prisma adapter dependencies.
- Root package scripts beyond the existing Prisma validation and formatting
  commands.
- API database module, repository, service, controller, DTO, or endpoint.
- Internal catalog API contract or public Swagger/OpenAPI.
- Seed scripts, catalog records, demo accounts, or media assets.
- Translation completeness enforcement across all catalog records.
- Runtime Zod validation.
- Test framework installation or automated test files.
- Search, filters, pagination, or frontend behavior.
- Auth, cart, checkout, order, or admin models.
- Planned bug flags, registry entries, or defect behavior.
- CI database service or migration replay changes.
- Destructive reset of an existing local database volume.

## Acceptance Criteria

- Prisma validates and formats successfully.
- The schema contains only the approved clean catalog boundary.
- All entity, translation, and join identities match the approved model.
- PostgreSQL names are explicitly mapped and stable.
- Money, stock, publication, localization, series, creator, genre, media
  reference, and ordering fields match `docs/product/catalog.md`.
- Required uniqueness and query indexes exist without speculative indexes.
- The committed initial migration contains the approved custom check
  constraints.
- The migration applies successfully to the local PostgreSQL service.
- Prisma reports no pending migration after application.
- No seed data or product rows are added.
- No Prisma Client generator, application database integration, API behavior,
  dependency, test framework, or planned bug is added.
- Relevant documentation and progress tracking agree with the implemented
  schema.

## Verification Plan

Before implementation:

- Confirm the local PostgreSQL service is healthy with
  `docker compose --env-file .env.example ps`.

During implementation:

- Run `pnpm db:format`.
- Run `pnpm db:validate`.
- Generate a draft migration with
  `pnpm exec prisma migrate dev --name catalog_foundation --create-only`.
- Review generated SQL before adding custom checks.
- Apply the reviewed migration with `pnpm exec prisma migrate dev`.
- Run `pnpm exec prisma migrate status`.

After implementation:

- Inspect the committed migration for all tables, foreign keys, indexes,
  enums, native types, and custom checks.
- Confirm the database contains no seeded product rows.
- Run existing frontend and backend typechecks and builds to detect repository
  regressions.
- Run `git diff --check`.
- Verify only approved files changed.

There is no automated database test framework yet. Constraint verification in
this task is migration review plus application to a clean local database. The
backend test foundation remains task `0014`.

## Documentation Impact

- Update `docs/product/catalog.md`.
- Update `docs/architecture.md`.
- Update `docs/local-development.md`.
- Update `PROGRESS.md`.
- Update this task with implementation notes and verification results.

## API Contract Impact

None. This task does not create or change public API behavior. The internal
catalog contract remains task `0015`.

## Seed Data Impact

None. Clean deterministic catalog data and local media remain task `0013`.

## Test Impact

- Health tests: manual local database health and migration application only.
- Clean core behavior tests: database integrity verification only; no test
  framework is introduced.
- Bug verification tests: none.
- Contract tests: none.
- Performance smoke tests: none.

## Bug Registry Impact

None. Every constraint describes clean expected behavior.

## Dependencies

None. The existing pinned Prisma CLI and Docker Compose PostgreSQL service are
sufficient.

## Commit Decision

Commit after this task. The human explicitly approved a dedicated commit.

## Implementation Notes

- Added the approved `Locale`, `PublicationState`, and `CreatorRole` enums.
- Added all nine approved catalog models and join boundaries with explicit
  snake_case PostgreSQL mappings.
- Used composite primary keys for translations, creator credits, and comic
  genres.
- Added bounded native string types, `timestamptz(3)` timestamps, stable unique
  identities, relationship actions, and only the approved read/reverse indexes.
- Created and applied migration
  `20260724110822_catalog_foundation`.
- Added 17 named PostgreSQL check constraints for clean identity formats,
  money, stock, sort order, series/issue consistency, and non-blank display
  text.
- Added no generator, Prisma Client, adapter, driver, seed data, API behavior,
  test framework, or planned bug.
- Updated architecture, catalog, local development, and progress documentation.

Verification completed:

- `pnpm.cmd db:format` passed.
- `pnpm.cmd db:validate` passed.
- `pnpm.cmd exec prisma migrate dev --name catalog_foundation --create-only`
  created the draft migration.
- The customized migration applied successfully to PostgreSQL `18.4`.
- A second `prisma migrate dev` run reported no schema change or pending
  migration.
- `pnpm.cmd exec prisma migrate status` reported one migration and an
  up-to-date schema.
- PostgreSQL catalog inspection found all 17 custom check constraints.
- All nine product tables contained zero rows after migration.
- Frontend and backend typechecks passed.
- Frontend and backend builds passed.

Local verification used host port `55432` because an unrelated host PostgreSQL
instance already occupied `5432`. The Compose named volume was preserved; no
database reset or volume deletion was performed. The temporary Compose service
was stopped after verification.

## Risks and Open Questions

- PostgreSQL check constraints edited into migration SQL are not represented
  fully in Prisma Schema Language. Future migrations must preserve them and
  migration review must detect accidental loss.
- A closed `Locale` enum makes EN/RU constraints clear but requires a migration
  to add another locale. This is recommended for the explicit MVP boundary.
- Explicit snake_case mapping is more verbose than Prisma defaults but keeps
  the database contract readable and stable independently of TypeScript naming.
- Composite primary keys keep translation and join identity honest but make
  those rows addressable only by their business key. No standalone row identity
  is currently needed.
- `timestamptz(3)` avoids server-timezone ambiguity but should be used
  consistently by future domain models.
- The proposed series/issue check and unique constraint make the documented
  clean rule a database invariant. Relaxing it later would require an explicit
  product decision and migration.
