# Task 0013: Clean Catalog Seed and Local Media

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24.
- Approved scope notes: All four recommended decisions were accepted: SQL seed
  through Prisma CLI, explicit catalog-only truncation without cascade, the
  10-comic fixture matrix, and eight generated covers plus one fallback.

Do not start implementation while the approval record remains pending.

## Behavior Type

Clean Feature

The deterministic catalog dataset, its explicit seed command, and repository
owned media are directly supporting clean product behavior.

## Background

Task `0012` created the clean catalog schema and initial migration. The database
currently contains no product rows, the frontend has no public media directory,
and Prisma has no seed command.

The approved catalog plan requires approximately 8-10 fictional comics with
EN/RU translations, deterministic identities, valid money and stock scenarios,
series and standalone items, publication visibility states, creator and genre
relations, local covers, and one clean missing-cover fallback.

This task should create that dataset without introducing API behavior, frontend
catalog UI, planned defects, or a premature application database layer.

Relevant references:

- `docs/product/catalog.md`
- `docs/architecture.md`
- `docs/local-development.md`
- `docs/tasks/0012-catalog-domain-schema-and-initial-migration.md`
- `AGENTS.md`

## Goal

Provide a deterministic, repeatable clean catalog dataset and original local
cover media that later API, UI, and automation tasks can use as stable product
fixtures.

## Proposed Decisions

These decisions become scope-locked only after human approval.

### Seed Runtime

Use a repository-owned SQL seed executed through Prisma CLI:

- Store the seed at `prisma/seed/catalog.sql`.
- Configure `migrations.seed` in `prisma.config.ts`.
- Add root command `db:seed` that runs `prisma db seed`.
- Have the configured seed command execute the SQL through
  `prisma db execute --file`.

This uses the existing Prisma CLI and `DATABASE_URL`. Do not add Prisma Client,
a generator, adapter, PostgreSQL driver, `tsx`, or another dependency solely
for the initial catalog seed.

The SQL approach is intentionally limited to this first catalog-only fixture.
Reassess the seed architecture when application database integration or
cross-domain auth/order fixtures justify a typed shared database package.

### Reset and Repeatability

- Run the seed in one transaction.
- Truncate the nine catalog tables as one explicit table set.
- Restart catalog identity sequences.
- Do not use `CASCADE`.
- Insert the complete known dataset after truncation.
- Fail rather than silently deleting future tables if another domain later
  references catalog records.
- Do not create a generic or destructive `db:reset` command.

Running `db:seed` twice must produce the same logical records and counts.
Automation must reference stable slugs and SKUs rather than generated IDs.

### Dataset Size

Seed exactly ten Comics:

- Eight `PUBLISHED`.
- One `DRAFT`.
- One `ARCHIVED`.
- Six series issues across three series.
- Four standalone comics.

All ten comics, all three series, and all genres must have both EN and RU
translations. Hidden records remain valid clean data even though public reads
will exclude them later.

### Media Strategy

- Generate original fictional raster artwork specifically for this repository.
- Use portrait PNG files with a consistent 2:3 aspect ratio.
- Use artwork without embedded titles, logos, watermarks, or real brands.
- Store comic covers under `apps/web/public/media/comics/`.
- Store database paths as `media/comics/<slug>.png` without a leading slash.
- Commit eight distinct comic cover files.
- Commit one deterministic `cover-fallback.png`.
- Leave `coverPath` null for the required missing-cover scenario and one hidden
  record; all other non-null paths must exist.
- Add a short media README recording generated/original provenance and the rule
  against commercial characters or copied covers.

No remote image URL may be part of the clean seed.

## Proposed Seed Matrix

Stable comic slugs, SKUs, and scenario roles:

| Slug | SKU | State | Shape | Primary Scenario |
| --- | --- | --- | --- | --- |
| `neon-harbor-1` | `QCG-NH-001` | `PUBLISHED` | Series issue 1 | Normal in-stock item |
| `neon-harbor-2` | `QCG-NH-002` | `PUBLISHED` | Series issue 2 | Limited stock and valid comparison price |
| `neon-harbor-3` | `QCG-NH-003` | `DRAFT` | Series issue 3 | Draft visibility exclusion |
| `clockwork-frontier-1` | `QCG-CF-001` | `PUBLISHED` | Series issue 1 | Out-of-stock item |
| `clockwork-frontier-2` | `QCG-CF-002` | `PUBLISHED` | Series issue 2 | Expensive item and multiple credits |
| `ember-archive-1` | `QCG-EA-001` | `ARCHIVED` | Series issue 1 | Archived visibility exclusion |
| `last-tram-to-orbit` | `QCG-LTO-001` | `PUBLISHED` | Standalone | Null cover path and long localized titles |
| `paper-moon-protocol` | `QCG-PMP-001` | `PUBLISHED` | Standalone | Cheap price boundary |
| `glass-signal` | `QCG-GS-001` | `PUBLISHED` | Standalone | Unicode title and creator data |
| `iron-orchard` | `QCG-IO-001` | `PUBLISHED` | Standalone | Multi-genre normal item |

Recommended series slugs:

- `neon-harbor`
- `clockwork-frontier`
- `ember-archive`

Recommended genre slugs:

- `science-fiction`
- `mystery`
- `adventure`
- `fantasy`
- `drama`
- `retro-futurism`

Use fictional creator identities, including at least one Cyrillic display name
and one creator credited in more than one role or on more than one comic.

Exact EN/RU titles, descriptions, creator names, valid integer prices, stock
counts, sort orders, genre assignments, credit order, and cover mapping must be
recorded in `docs/product/catalog-seed.md` during implementation. They may not
change the scenario role or stable identity approved above.

## Seed Integrity Assertions

The SQL seed should fail its transaction when its final state does not contain:

- Exactly 10 comics.
- Exactly 8 published, 1 draft, and 1 archived comic.
- Exactly 20 comic translations.
- Both locales for every comic, series, and genre.
- Exactly 6 series issues and 4 standalone comics.
- At least one zero-stock published comic.
- At least one limited-stock published comic.
- At least one valid comparison-price comic.
- At least one published comic with a null cover path.
- At least one comic with multiple creators.
- At least one comic with multiple genres.
- Only `USD`.
- No cover path outside the approved local media prefix.

Database constraints remain responsible for invalid identity formats, money,
stock, sort order, non-blank display text, translation uniqueness, and
series/issue consistency.

Filesystem verification must separately confirm that every non-null cover path
maps to a committed file and that the fallback file exists.

## Scope

- Create `prisma/seed/catalog.sql`.
- Configure the explicit seed command in `prisma.config.ts`.
- Add root `db:seed` package script.
- Create `docs/product/catalog-seed.md` with the final stable fixture matrix,
  localized text, values, relations, and media mapping.
- Create `apps/web/public/media/comics/`.
- Add eight original generated comic cover PNGs.
- Add one deterministic fallback PNG.
- Add `apps/web/public/media/comics/README.md` with media provenance and usage
  constraints.
- Run the seed against the migrated local PostgreSQL database twice.
- Verify stable logical output, exact counts, translations, relations, and
  filesystem-backed media.
- Update catalog, architecture, local development, progress, and this task with
  final implementation facts.

## Out of Scope

- Prisma schema or migration changes.
- Prisma Client generator or generated client.
- `@prisma/client`, adapter, PostgreSQL driver, TypeScript runner, image
  processing library, or another dependency.
- Shared database package or backend database provider.
- API contract, endpoint, controller, service, repository, or DTO.
- Frontend catalog components, routing, data fetching, localization, or image
  rendering behavior.
- Runtime fallback selection or accessible image alternative text
  implementation.
- Demo user/admin accounts or auth data.
- Cart, checkout, order, or admin records.
- Search and filter behavior.
- Remote images, copied commercial covers, real comic brands, or real
  characters.
- Broken media, invalid values, incomplete translations, duplicate identities,
  or another planned bug.
- Generic database reset command.
- Test framework installation or automated application tests.

## Acceptance Criteria

- `pnpm db:seed` is explicit and succeeds only against a migrated database.
- No new dependency or Prisma Client generator is added.
- The seed runs as one transaction.
- The seed resets only the explicit catalog table set and does not use
  `CASCADE`.
- Two consecutive seed runs produce the same logical dataset and exact counts.
- The approved 10-comic scenario matrix is present.
- Every comic, series, and genre has EN and RU translations.
- All money uses integer minor units and `USD`.
- All database constraints remain satisfied.
- Exactly eight comics are published; draft and archived records remain valid.
- Every non-null cover path resolves to a committed local PNG.
- The null-cover scenario resolves to a committed deterministic fallback in a
  later UI task; this task only provides the asset and data state.
- Media is original/generated for this repository and contains no embedded
  commercial identity.
- Seed documentation is specific enough for future API and automation tasks to
  use slugs and SKUs as stable fixtures.
- No API, UI, auth, test framework, planned bug, schema migration, or
  application database integration is added.

## Verification Plan

- Run `pnpm db:validate`.
- Run `pnpm exec prisma migrate status`.
- Run `pnpm db:seed`.
- Query and record entity, state, locale, series/standalone, money, stock, and
  relationship counts.
- Run `pnpm db:seed` a second time.
- Repeat the same queries and compare logical counts and stable slugs/SKUs.
- Confirm `_prisma_migrations` is unchanged by seeding.
- Verify every non-null `coverPath` resolves below
  `apps/web/public/media/comics/`.
- Inspect every generated PNG for correct framing, distinct artwork, absence of
  text/watermarks, and usable portrait composition.
- Verify PNG dimensions and 2:3 aspect ratio.
- Run frontend and backend typechecks and builds.
- Run `git diff --check`.
- Verify only approved files changed.

The backend test foundation remains task `0014`; this task uses seed assertions
and direct database inspection rather than adding a test framework.

## Documentation Impact

- Create `docs/product/catalog-seed.md`.
- Create the media provenance README.
- Update `docs/product/catalog.md`.
- Update `docs/architecture.md`.
- Update `docs/local-development.md`.
- Update `PROGRESS.md`.
- Update this task with implementation and verification results.

## API Contract Impact

None. Stable slugs and SKUs become future contract fixtures, but no API
behavior or contract is created here.

## Seed Data Impact

Creates the initial clean catalog seed and its explicit repeatable command.

## Test Impact

- Health tests: manual migrated-database and seed execution checks.
- Clean core behavior tests: seed integrity assertions and direct database
  verification only.
- Bug verification tests: none.
- Contract tests: none.
- Performance smoke tests: none.

## Bug Registry Impact

None. All records and assets represent valid clean behavior.

## Dependencies

None. Use the existing Prisma CLI, PostgreSQL service, and image generation
capability. Do not add an image runtime dependency to the repository.

## Commit Decision

Commit after this task. The human explicitly approved a dedicated commit.

## Implementation Notes

- Added `prisma/seed/catalog.sql` as one transactional clean fixture.
- Configured explicit Prisma ORM 7 seeding and added root `db:seed`.
- Seed replacement names all nine catalog tables, restarts their identities,
  and does not use `CASCADE`.
- Added built-in SQL assertions for fixture counts, publication states,
  translation completeness, scenario coverage, local path shape, and USD-only
  money.
- Added 10 comics, 3 series, 8 fictional creators, 6 genres, 20 comic
  translations, 23 credits, and 26 comic-to-genre relations.
- Added eight original generated cover PNGs and one deterministic fallback PNG.
- All assets are 1024 by 1536 pixels, use a 2:3 ratio, and have distinct hashes.
- Removed an incidental number-like hull marking from `neon-harbor-2.png`
  during visual review.
- Added fixture and media provenance documentation.
- Added no schema change, migration, Prisma Client, generator, adapter, driver,
  TypeScript runner, API behavior, UI behavior, test framework, or planned bug.

Verification completed:

- `pnpm.cmd db:validate` passed.
- `pnpm.cmd db:seed` completed successfully for both final repeatability runs.
- Both runs produced logical fixture hash
  `7469e64c6dc462c187f1f9f074d54312`.
- Final database counts are 10 comics, 8 published comics, 20 comic
  translations, 3 series, 8 creators, 6 genres, 23 credits, and 26 genre
  relations.
- `_prisma_migrations` remained at one applied migration.
- Every non-null database cover path resolves to a committed local PNG.
- The deterministic fallback asset exists.
- All nine PNG files were visually inspected and dimension-checked.
- The nine PNG files total 25.49 MB.
- Frontend and backend typechecks passed.
- Frontend and backend builds passed.
- `git diff --check` passed.

Local database verification used host port `55432` because another PostgreSQL
instance occupies `5432`. The temporary Compose service was stopped after
verification, and its named volume was preserved.

## Risks and Open Questions

- SQL seed data is less type-guided than Prisma Client code, but it avoids
  introducing the future application database architecture inside a fixture
  task and directly exercises PostgreSQL constraints.
- Explicit catalog-table truncation is intentionally strict. A future foreign
  key from orders or another domain should make this seed fail until reset
  semantics are reviewed, rather than silently cascading data deletion.
- Raster assets increase repository size. Eight covers plus one fallback is the
  smallest set that keeps the first catalog visually inspectable and varied.
- Generated artwork must be visually reviewed; successful file generation alone
  is not sufficient acceptance.
- Cover paths are frontend-public relative paths. The API contract must later
  define whether responses expose these paths directly or convert them to
  absolute URLs.
