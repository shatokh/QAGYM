# Task 0011: Phase 1 Catalog Foundation Plan

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24.
- Approved scope notes: All five recommended review options were accepted.
  A later conversation amendment approved catalog decision alignment in
  `PROJECT_BRIEF.md` and `docs/high-level-plan.md`.

## Behavior Type

Docs Only

## Background

The platform foundation is complete enough to start the first product domain.
Before creating a Prisma model, the project needs one explicit clean catalog
specification that defines the MVP entity boundaries, business rules, seed
scenarios, contract and test expectations, and implementation task split.

The documentation audit accepted these directions:

- Phase 1 includes a minimal deterministic clean catalog seed.
- Internal behavior/API contracts and relevant clean tests evolve with each
  feature.
- Localized catalog content uses normalized translation records.
- Money uses integer minor units plus an ISO currency code.
- Display-only discounts may use an optional comparison price.
- Clean catalog covers use stable local assets with a deterministic fallback.
- A product migration may remain in a Clean Feature task when it directly
  represents that feature and is explicitly scoped.

This task converts those directions into a reviewable catalog foundation plan.
It does not create the schema or application behavior.

Relevant references:

- `PROJECT_BRIEF.md`
- `ROADMAP.md`: Phase 1.
- `PROGRESS.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/high-level-plan.md`
- `docs/tasks/0010-documentation-audit-alignment.md`
- `AGENTS.md`

## Goal

Create a clean catalog domain specification that is precise enough to plan the
first Prisma schema and migration without silently deciding business rules
during implementation.

## Scope

### Catalog Domain Document

- Create `docs/product/catalog.md`.
- Define the clean MVP catalog terminology and business rules.
- Treat a `Comic` as one sellable comic issue or standalone volume.
- Separate catalog behavior from cart, checkout, auth, admin mutation, and
  planned bug behavior.

### Recommended Entity Boundary

Document the recommended normalized model:

- `Comic`: sellable catalog record, pricing, stock, publication state, media
  reference, merchandising order, and timestamps.
- `ComicTranslation`: localized title and description keyed by comic and
  locale.
- `Series`: optional grouping for related comics.
- `SeriesTranslation`: localized series title.
- `Creator`: person credited on comics.
- `ComicCreator`: comic-to-creator relation with an explicit initial role of
  `WRITER` or `ARTIST`.
- `Genre`: catalog classification.
- `GenreTranslation`: localized genre name.
- `ComicGenre`: comic-to-genre relation.

Do not add publisher, reviews, ratings, wishlists, tags, full inventory history,
or arbitrary product attributes to the first model.

## Accepted Review Decisions

### Entity Normalization

1. Fully normalize creators, genres, and series as proposed.
2. Store author, genre, and series as scalar fields on `Comic`.
3. Start with comic translations only and add all taxonomy later.

Accepted: option 1. It supports the accepted filter direction and future admin
editing without immediate schema replacement.

### Internal Identity

1. Integer ID plus stable slug and SKU.
2. UUID ID plus stable slug and SKU.
3. UUID only.

Accepted: option 1. Predictable IDs improve deterministic local QA and API
scenarios, while slug and SKU provide stable public/business identity.

### First Read Slice

1. Paginated list and slug detail first; search and filters follow as separate
   Phase 1 tasks.
2. List, detail, search, and all filters in one API/UI slice.
3. Unpaginated list only.

Accepted: option 1. It produces a usable vertical slice without making the first
API and frontend tasks too broad.

### Initial Currency

1. Store currency per comic and seed only `USD`.
2. Store currency per comic and seed only `EUR`.
3. Use a fictional currency.

Accepted: option 1. It exercises locale-aware display while avoiding
multi-currency checkout behavior.

### Translation Completeness

1. Require EN and RU translations for every standard clean seed item.
2. Require EN and allow RU to fall back to EN in visible seed data.
3. Require only one arbitrary translation.

Accepted: option 1. It keeps fallback behavior from looking like an accidental
localization defect in the initial clean catalog. Runtime fallback can still be
specified and tested separately.

### Recommended Identity Rules

- Use database-generated integer IDs for internal relational identity and
  predictable local QA scenarios.
- Use a unique stable lowercase ASCII `slug` for product URLs.
- Use a unique stable `sku` for product identity in seed, admin, and API
  scenarios.
- Do not expose a numeric ID as authorization. Future access control must remain
  explicit even when IDs are predictable.

### Recommended Localization Rules

- Use locale codes `en` and `ru` for the initial product scope.
- Require one translation per comic and locale in the standard clean seed.
- Use `en` as the documented fallback locale if runtime content is incomplete.
- Enforce uniqueness by parent entity and locale.
- Keep slugs and SKUs locale-independent.
- Defer the frontend i18n library and localized routing decision to the first
  frontend catalog foundation task.

### Recommended Money and Discount Rules

- Store `priceMinor` as a non-negative integer.
- Store `currencyCode` as an uppercase ISO 4217 code.
- Use one seed currency, `USD`, for the initial clean catalog.
- Allow nullable `compareAtPriceMinor` for display-only discounts.
- When present, `compareAtPriceMinor` must be greater than `priceMinor`.
- Do not add percentage calculations, promocodes, campaign rules, or a discount
  engine.
- API contracts must serialize money without floating-point arithmetic.

### Recommended Stock and Publication Rules

- Store `stockQuantity` as a non-negative integer.
- Treat zero stock as a clean, visible out-of-stock state.
- Use publication states `DRAFT`, `PUBLISHED`, and `ARCHIVED`.
- Public catalog reads return only `PUBLISHED` comics.
- Archived and draft records remain unavailable to public reads.
- Do not implement reservations, warehouses, or stock history in Phase 1.

### Recommended Media Rules

- Store a nullable stable relative cover asset path.
- Serve clean cover assets from the repository-backed frontend public assets.
- Use one deterministic local fallback when the cover path is absent.
- Do not rely on third-party image hosts for clean scenarios.
- Do not seed a broken URL. Broken media is future registered planned bug
  behavior.

### Recommended Catalog Query Rules

- Use explicit non-negative `sortOrder` for deterministic merchandising.
- Break equal sort order by internal ID.
- The first read slice should implement:
  - Paginated published catalog list.
  - Product detail by stable slug.
  - Deterministic ordering.
- Search and filters for genre, creator, series, price, and availability remain
  Phase 1 Clean Features but should be implemented through separate tasks after
  list and detail behavior is stable.
- Exact API pagination shape, limits, errors, and query syntax belong to the
  internal catalog API contract task.

### Minimal Clean Seed Plan

Define a deterministic Phase 1 seed of approximately 8-10 comics covering:

- Normal in-stock comic.
- Out-of-stock comic.
- Comic with long EN and RU titles.
- Comic without a cover path, using the clean fallback.
- Display-only discounted comic with a comparison price.
- Unicode title and creator data.
- Cheap and expensive price boundaries.
- Limited-stock item.
- Series and standalone items.
- Multiple genres and creator roles.

Every visible seed item should be valid clean behavior. Do not include broken
URLs, invalid prices, negative stock, missing required translations, duplicate
slugs, or another planned defect.

### Internal Contract and Test Direction

- Identify `docs/internal/api/catalog.md` as the proposed repository-first
  internal catalog API contract location.
- Require schema and seed integrity verification before catalog API work.
- Require the first backend/API test foundation before implementing public
  catalog API behavior.
- Require catalog API clean behavior tests with the API feature.
- Require frontend clean behavior coverage when the frontend catalog is
  implemented.
- Keep public Swagger publication in Phase 5.
- Add no test framework or API contract in this planning task.

### Recommended Implementation Split

Document this proposed sequence after task `0011`:

1. `0012` - Catalog Domain Schema and Initial Migration.
2. `0013` - Clean Catalog Seed and Local Media.
3. `0014` - Backend Test Foundation.
4. `0015` - Catalog Read API and Internal Contract.
5. `0016` - Frontend Catalog Foundation.
6. `0017` - Catalog List and Product Detail UI.
7. Later Phase 1 tasks - catalog search, filters, and expanded automation.

Task IDs may be refined before approval if another task must be inserted.

### Documentation Updates

- Update `docs/architecture.md` with the approved domain boundary and task
  sequence.
- Update `PROGRESS.md` with accepted catalog decisions and remaining questions.
- Update `PROJECT_BRIEF.md` and `docs/high-level-plan.md` so accepted catalog
  decisions are no longer listed as unresolved.
- Update `ROADMAP.md` only if the approved plan changes its current Phase 1
  wording.

## Out of Scope

- Prisma schema, generator, migration, or generated client.
- PostgreSQL tables or data.
- Seed implementation or image asset creation.
- Package or lockfile changes.
- Backend database module or Prisma Client integration.
- API endpoint or API contract implementation.
- Test framework or test implementation.
- React Router, TanStack Query, i18n, or UI kit setup.
- Frontend catalog or product detail behavior.
- Auth, roles, cart, checkout, orders, or admin mutation behavior.
- Public Swagger/OpenAPI.
- Planned bug registration, flags, or implementation.
- Publisher, reviews, ratings, wishlists, tags, warehouse inventory, or
  multi-currency checkout behavior.

## Acceptance Criteria

- `docs/product/catalog.md` defines clean catalog terminology and rules.
- The approved entity boundary is explicit.
- Identity, localization, money, comparison price, stock, publication, media,
  and deterministic ordering rules are explicit.
- The clean seed scenario list contains no planned defect.
- List/detail scope is separated from later search/filter tasks.
- Internal contract and clean test timing agrees with project governance.
- The implementation sequence is small and reviewable.
- Remaining disagreements are recorded rather than silently resolved.
- No schema, migration, seed, dependency, API, test, UI, or planned bug
  implementation is added.

## Verification Plan

- Review the domain document against project brief, roadmap, architecture, and
  strategic plan.
- Verify every catalog rule describes clean expected behavior.
- Verify all accepted audit decisions are represented.
- Verify all remaining decisions have explicit options and a recommendation.
- Verify the proposed implementation tasks do not mix unrelated behavior.
- Search for accidental planned bug or spoiler content.
- Run `git diff --check`.
- Verify only approved documentation files changed.

No application test command is required because this is a documentation-only
planning task.

## Documentation Impact

- Create `docs/product/catalog.md`.
- Update `docs/architecture.md`.
- Update `PROGRESS.md`.
- Update `PROJECT_BRIEF.md`.
- Update `docs/high-level-plan.md`.
- Update `ROADMAP.md` only if review changes current Phase 1 wording.
- Update this task with accepted decisions and implementation notes.

## API Contract Impact

No API contract is created. The task chooses the proposed location and defines
the boundary for a later catalog API contract.

## Seed Data Impact

No seed data is created. The task defines clean seed scenarios and integrity
rules for task `0013`.

## Test Impact

- Health tests: planning only.
- Clean core behavior tests: planning only.
- Bug verification tests: none.
- Contract tests: planning only.
- Performance smoke tests: none.

## Bug Registry Impact

None. Broken media and other defects remain excluded from clean catalog work.

## Dependencies

None.

## Commit Decision

Commit after this task. The human explicitly approved a dedicated documentation
commit.

## Implementation Notes

- Created `docs/product/catalog.md` as the clean catalog domain source.
- Defined `Comic`, localized translation, series, creator, genre, and join
  boundaries without adding a Prisma schema.
- Recorded integer internal IDs, stable slugs and SKUs, publication states,
  money, stock, media, deterministic ordering, and localization rules.
- Defined the minimal clean seed scenario set and explicitly excluded planned
  defects and third-party media dependencies.
- Recorded list/detail as the first read slice and deferred search/filter
  behavior to separate Phase 1 tasks.
- Recorded the repository-first internal catalog contract location and the
  required backend test foundation sequence.
- Updated architecture and progress with accepted decisions and task sequence.
- Updated project brief and strategic reference under the approved amendment.
- Reviewed the current Phase 1 roadmap wording; no change was required.
- Added no schema, migration, seed, asset, package, API, test, UI, or planned
  bug implementation.

Verification completed:

- Catalog terminology and accepted decisions are consistent across product
  spec, brief, progress, architecture, and strategic reference.
- No accepted catalog decision remains listed as unresolved in active planning
  documents.
- Clean seed rules contain no broken media, invalid data, or planned defect.
- Deferred decisions are limited to Prisma, API contract, search/filter, and
  frontend implementation details.
- Only approved documentation files changed.
- `git diff --check` passed.

## Risks and Open Questions

- A fully normalized model is more verbose than scalar author/genre/series
  fields, but avoids planned Phase 1 filters and Phase 4 admin work forcing an
  immediate schema redesign.
- Predictable integer IDs are useful for deterministic QA scenarios but must
  never substitute for authorization checks.
- `USD` is the recommended single seed currency because it allows RU/EN locale
  formatting without adding multi-currency commerce rules.
- Requiring both EN and RU translations in the standard clean seed keeps
  fallback behavior from looking like an accidental localization defect.
- Search and filters are intentionally separated from the first list/detail
  slice to keep implementation tasks reviewable.
