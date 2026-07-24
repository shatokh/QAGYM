# Task 0015: Catalog Read API and Internal Contract

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24.
- Approved scope notes: All seven recommendations were accepted: versioned
  comic routes, page-based pagination, query locale, stable product DTOs, Zod
  and shared errors, Prisma 7 with the PostgreSQL adapter, and seeded
  PostgreSQL API tests.
- Amendment: The human project owner approved adding `README.md` to the
  documentation synchronization scope on 2026-07-24 because its current-status
  section still described the pre-catalog foundation.

The approved decisions and scope are locked for implementation.

## Behavior Type

Clean Feature

The primary observable change is correct public catalog read behavior. Prisma
Client runtime wiring, request validation, contract documentation, and
database-backed API tests directly support that behavior and are explicitly
scoped here.

## Background

The clean catalog schema, migration, deterministic seed, local media, and
backend test foundation now exist. The API still exposes only `GET /health` and
has no database provider, catalog module, product API contract, or catalog
tests.

The approved Phase 1 sequence identifies this task as the first backend product
slice:

1. Catalog schema and migration: done in `0012`.
2. Clean seed and media: done in `0013`.
3. Backend test foundation: done in `0014`.
4. Catalog read API and internal contract: this task.

This task must resolve the deferred Prisma Client, pagination, locale, response,
error, and relation-ordering decisions before implementation. It must preserve
the Clean Core rule: only correct published list and slug detail behavior is
introduced.

Relevant references:

- `docs/product/catalog.md`
- `docs/product/catalog-seed.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/adr/ADR-0005-public-and-internal-api-docs.md`
- `docs/tasks/0011-phase-1-catalog-foundation-plan.md`
- `docs/tasks/0014-backend-test-foundation.md`
- Prisma ORM 7 Client generation and PostgreSQL adapter documentation

## Goal

Deliver a documented and tested clean catalog read API that returns only
published comics from PostgreSQL, supports deterministic pagination and EN/RU
content, and becomes the backend contract for the next frontend catalog tasks.

## Proposed Review Decisions

These decisions become scope-locked only after human approval.

### 1. Product API Route

Options:

1. Use `GET /api/v1/comics` and `GET /api/v1/comics/:slug`.
2. Use unversioned `GET /api/comics` and `GET /api/comics/:slug`.
3. Use `GET /api/v1/catalog/comics` and
   `GET /api/v1/catalog/comics/:slug`.

Recommendation: option 1.

Benefits:

- Establishes an explicit product API version before frontend integration.
- Keeps resource paths short and avoids repeating `catalog`.
- Leaves `GET /health` unchanged outside the product API namespace.
- Avoids adding global Nest prefix behavior in this task; the catalog
  controller may own the explicit `api/v1/comics` route.

### 2. Pagination Model

Options:

1. Page-based pagination with `page` and `pageSize`.
2. Offset-based pagination with `offset` and `limit`.
3. Cursor pagination.

Recommendation: option 1 with:

- `page` default `1`.
- `pageSize` default `12`.
- `pageSize` maximum `50`.
- Both values must be decimal positive integers.
- A page beyond the last page returns HTTP `200` with an empty `data` array.
- `totalPages` is `0` when `totalItems` is `0`.

Benefits:

- Easy to inspect manually and automate in a QA training product.
- Supports deterministic boundary and invalid-input scenarios.
- Is sufficient for the small local catalog without cursor complexity.

The list envelope should be:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

### 3. Locale Transport and Fallback

Options:

1. Query parameter `locale=en|ru`, defaulting to `en`.
2. `Accept-Language` header negotiation.
3. Locale in the route, such as `/api/v1/en/comics`.

Recommendation: option 1.

Benefits:

- Explicit and easy to reproduce in browser, curl, Postman, and automation.
- Avoids ambiguous header priority and regional locale parsing in the first
  slice.
- Does not force the future frontend URL locale strategy.

Rules:

- List and detail accept only `en` or `ru`.
- Omitted locale means `en`.
- Unsupported or repeated locale values return HTTP `400`.
- If requested localized content is unexpectedly absent, use the entity's EN
  translation.
- Fallback applies independently to comic, series, and genre content.
- Each localized response object exposes its effective `contentLocale` so
  fallback is observable.
- The current clean seed has complete EN/RU content and does not depend on
  fallback.

### 4. Response Boundary

Options:

1. Return a stable product DTO independent from Prisma records.
2. Serialize Prisma records directly.
3. Return one large response containing every database field and relation.

Recommendation: option 1.

Benefits:

- Prevents database representation from becoming an accidental public
  contract.
- Excludes internal IDs, publication state, sort order, and timestamps that
  the current public read workflow does not need.
- Gives frontend tasks a stable and intentional shape.

Recommended list item fields:

- `slug`
- `sku`
- `title`
- `contentLocale`
- `series`: `null` or `slug`, `title`, `contentLocale`, and `issueNumber`
- `creators`: `slug`, `displayName`, and `role`
- `genres`: `slug`, `name`, and `contentLocale`
- `price`: `amountMinor` and `currencyCode`
- `compareAtPrice`: the same money shape or `null`
- `stock`: `quantity` and derived `inStock`
- `coverPath`: repository-relative string or `null`

The detail response uses the same fields and adds `description`.

Additional rules:

- Do not expose the numeric database ID.
- Do not convert money to floating point or formatted display strings.
- `inStock` is exactly `stock.quantity > 0`.
- Preserve `coverPath: null`; selecting
  `media/comics/cover-fallback.png` remains frontend behavior.
- Return only `PUBLISHED` comics.
- List order is `sortOrder ASC`, then internal comic ID `ASC`.
- Creator order is `WRITER` before `ARTIST`, then credit `sortOrder ASC`, then
  creator slug `ASC`.
- Genre order is stable genre slug `ASC`, independent of database collation.
- Draft, archived, and unknown valid slugs all use the same not-found response.

### 5. Validation and Error Envelope

Options:

1. Add Zod request schemas and one stable shared API error envelope.
2. Use Nest primitive parsing pipes and the default Nest error bodies.
3. Accept coercible values and normalize invalid input silently.

Recommendation: option 1.

Benefits:

- Implements the previously accepted Zod direction at the first real request
  DTO boundary.
- Makes invalid-input behavior deterministic for API testing.
- Avoids leaking Zod, Prisma, PostgreSQL, or stack-trace details.
- Creates a small reusable error contract for later clean APIs.

Recommended error shape:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed.",
    "details": [
      {
        "path": "page",
        "message": "Expected a positive integer."
      }
    ]
  }
}
```

Rules:

- Invalid query or malformed slug: HTTP `400`, code `INVALID_REQUEST`.
- Unknown, draft, or archived valid slug: HTTP `404`, code
  `COMIC_NOT_FOUND`.
- Unexpected server failure: HTTP `500`, code `INTERNAL_ERROR`, generic
  message, and no internal details.
- The envelope always contains `error.code`, `error.message`, and
  `error.details`; `details` may be an empty array.
- Error detail ordering must be deterministic.
- Unknown query parameters are rejected rather than ignored.
- Register shared error handling through Nest providers so production and test
  application initialization use the same behavior.

### 6. Prisma Client Runtime and Environment

Options:

1. Use Prisma ORM 7 `prisma-client` generator with an explicit API-owned output
   and the PostgreSQL driver adapter.
2. Use the deprecated `prisma-client-js` generator.
3. Bypass Prisma Client and query PostgreSQL directly.

Recommendation: option 1.

The implementation should:

- Add a `generator client` block using provider `prisma-client`.
- Generate to `apps/api/src/generated/prisma`.
- Ignore generated Prisma Client output in Git.
- Add root `db:generate` and explicit root `postinstall` generation commands.
- Never edit or commit generated Prisma Client files.
- Add an API-owned Prisma service/module using `PrismaPg`.
- Validate `DATABASE_URL` before creating the adapter.
- Load the ignored repository-root `.env` for local API commands without
  overriding an already supplied process environment value.
- Disconnect Prisma when the Nest application closes.
- Keep database access inside the API app; do not create `packages/shared` for
  generated database types.

Exact proposed dependencies in `apps/api/package.json`:

- Runtime: `@prisma/client` `7.9.0`.
- Runtime: `@prisma/adapter-pg` `7.9.0`.
- Runtime: `pg` `8.22.0`.
- Runtime: `dotenv` `17.4.2`.
- Runtime: `zod` `4.4.3`.
- Development types: `@types/pg` `8.20.0`.

Prisma CLI remains root dev dependency `7.9.0`. No additional service,
framework, validation package, ORM, or query library is approved.

### 7. API Test Database and CI

Options:

1. Run read-only catalog API tests against the migrated deterministic seed in
   PostgreSQL.
2. Mock all database behavior in API tests and defer real integration.
3. Add Testcontainers or an embedded database.

Recommendation: option 1.

Benefits:

- Verifies the real Prisma query, publication filtering, relations, locale
  selection, and ordering.
- Reuses the approved local-first PostgreSQL runtime and deterministic seed.
- Adds no new test framework or container dependency.
- Keeps tests read-only after preparation.

Rules:

- `pnpm test` remains database-independent backend unit tests.
- `pnpm test:api` becomes the complete backend API suite and requires a
  migrated, seeded test database once catalog API tests are added.
- Catalog API tests must not mutate data or reseed during individual tests.
- CI adds PostgreSQL `18.4-alpine`, applies committed migrations, runs the
  clean seed once, then executes API tests in-band.
- CI uses demo-only credentials and a CI-local database.
- The health API test remains present and `GET /health` behavior remains
  unchanged.
- Unit tests should cover mapping and EN fallback using controlled mocked
  records where the complete seed cannot exercise missing translation.
- API tests should cover list, detail, locale, pagination, visibility,
  ordering, money, stock, relation order, validation, and not-found behavior.
- Do not add Testcontainers, Vitest, Playwright, or k6.

## Scope

### Internal Contract

- Create `docs/internal/api/catalog.md`.
- Document exact routes, query parameters, defaults, limits, response fields,
  ordering, fallback, statuses, and error shapes.
- Clearly mark the document as internal developer contract, not public training
  Swagger.

### Prisma Client Integration

- Add the approved Prisma Client generator and output path.
- Add the six approved exact API dependencies.
- Update `pnpm-lock.yaml`.
- Add generated output to `.gitignore`.
- Add explicit Prisma Client generation commands.
- Add minimal API environment loading and validation.
- Add an API-owned Prisma module/service with clean shutdown.

### Catalog Read API

- Add a Nest catalog module, controller, service, request schemas, response
  types, mapping, and directly supporting error handling.
- Implement the approved list and slug-detail routes.
- Query only published records.
- Apply deterministic list and relation ordering.
- Apply locale selection and documented EN fallback.
- Return only the approved DTO fields.

### Tests and CI

- Add focused catalog service unit tests.
- Add database-backed read-only catalog API tests.
- Preserve existing health unit and API tests.
- Add PostgreSQL service, migration, and seed preparation to the existing CI
  quality job.
- Keep unit and API gates separately named.

### Documentation Synchronization

- Update `docs/product/catalog.md` with resolved API decisions.
- Update `docs/architecture.md` with Prisma Client ownership and catalog API
  structure.
- Update `docs/testing-strategy.md` and `docs/local-development.md`.
- Update `AGENTS.md` for the new database requirement of `pnpm test:api`.
- Update `PROJECT_BRIEF.md`, `docs/high-level-plan.md`, and `PROGRESS.md` so
  resolved pagination, locale, response, and error decisions are not still
  listed as pending.
- Update `README.md` so repository status and available catalog behavior are
  accurate.
- Update this task with implementation and verification results.

## Out of Scope

- Search.
- Filters for genre, creator, series, price, or availability.
- Alternate sorting parameters.
- Catalog write endpoints.
- Admin catalog behavior.
- Public Swagger/OpenAPI generation or publication.
- Frontend API client, routing, state, i18n, list, or detail UI.
- Shared package creation.
- New product models or schema migration.
- Seed data or media changes.
- Auth, roles, cart, checkout, orders, or demo accounts.
- Caching, ETags, CDN behavior, rate limiting, or production observability.
- Cursor pagination.
- Regional locales such as `en-US` or `ru-RU`.
- Currency formatting or conversion.
- Prisma Studio.
- Testcontainers, embedded PostgreSQL, or a second ORM.
- Planned bug flags, registry entries, spoiler content, or defect behavior.
- Unrelated refactoring of health or application bootstrap behavior.

## Acceptance Criteria

- The internal contract exists and matches implemented list/detail behavior.
- `GET /health` remains HTTP `200` with `{ "status": "ok" }`.
- `GET /api/v1/comics` returns only the eight published clean seed comics.
- Default list ordering follows `sortOrder`, then internal ID.
- Pagination defaults, maximum, totals, empty-page behavior, and invalid
  boundaries match the approved contract.
- `locale=en` and `locale=ru` return the expected localized seed content.
- Unit coverage proves EN fallback for unexpectedly incomplete translations.
- Detail by published slug returns the approved detail DTO.
- Draft, archived, and unknown valid slugs return the same exact `404` envelope.
- Invalid query and malformed slug inputs return the exact `400` envelope.
- Unknown query parameters are rejected.
- Money remains integer minor units plus currency code.
- Stock exposes quantity and correctly derived `inStock`.
- Cover path remains nullable.
- Creator and genre relations have deterministic documented order.
- No numeric database ID, internal publication state, sort order, or timestamp
  leaks into catalog DTOs.
- Prisma Client generation is repeatable and generated files remain untracked.
- API startup fails clearly when `DATABASE_URL` is unavailable or invalid.
- Prisma connections close with the Nest application.
- `pnpm test` passes without PostgreSQL.
- `pnpm test:api` passes against the prepared deterministic PostgreSQL fixture.
- CI prepares PostgreSQL and runs separate unit and API gates.
- Existing frontend/backend typechecks, builds, Prisma validation, and Compose
  validation continue to pass.
- No search, filter, write API, Swagger, frontend, migration, seed, planned bug,
  or unrelated refactor is added.

## Verification Plan

- Install only the approved exact dependencies.
- Run `pnpm install --frozen-lockfile`.
- Run `pnpm db:generate` and verify generated output is ignored.
- Run `pnpm db:validate`.
- Run Docker Compose configuration validation.
- Start local PostgreSQL.
- Apply committed migrations.
- Run the deterministic clean catalog seed.
- Run `pnpm test`.
- Run `pnpm test:api`.
- Verify API test discovery remains separate from unit test discovery.
- Run frontend and backend typechecks.
- Run frontend and backend builds.
- Start the compiled API with the local database.
- Exercise list and detail routes for EN and RU.
- Exercise pagination and invalid query boundaries.
- Exercise published, draft, archived, and unknown slugs.
- Verify the API does not return internal IDs or unpublished records.
- Review CI workflow syntax and PostgreSQL health setup.
- Run `git diff --check`.
- Verify only approved files changed.

## Documentation Impact

- Create `docs/internal/api/catalog.md`.
- Update `docs/product/catalog.md`.
- Update `docs/architecture.md`.
- Update `docs/testing-strategy.md`.
- Update `docs/local-development.md`.
- Update `AGENTS.md`.
- Update `PROJECT_BRIEF.md`.
- Update `README.md`.
- Update `docs/high-level-plan.md`.
- Update `PROGRESS.md`.
- Update this task.

Public training documentation and Swagger remain unchanged.

## API Contract Impact

Creates the first repository-backed internal product API contract and the first
catalog API behavior. Public Swagger/OpenAPI remains deferred to Phase 5.

## Seed Data Impact

No seed data changes. Database-backed API tests read the deterministic fixture
from `prisma/seed/catalog.sql`. CI runs the existing seed once before the API
suite.

## Test Impact

- Health tests: preserved; health behavior must remain unchanged.
- Clean core behavior tests: add catalog mapping, locale fallback, published
  visibility, pagination, list, and detail coverage.
- Bug verification tests: none.
- Contract tests: add HTTP assertions against the internal catalog contract.
- Performance smoke tests: none.

## Bug Registry Impact

None. All planned bugs remain disabled and unavailable.

## Dependencies

Exact proposed API dependencies:

- `@prisma/client` `7.9.0`.
- `@prisma/adapter-pg` `7.9.0`.
- `pg` `8.22.0`.
- `dotenv` `17.4.2`.
- `zod` `4.4.3`.
- `@types/pg` `8.20.0`.

Existing PostgreSQL `18.4-alpine`, Prisma CLI `7.9.0`, Jest, ts-jest, and
Supertest are reused. No other dependency, service, or lifecycle allowance is
approved.

## Commit Decision

Approved by the human project owner on 2026-07-24. Commit task `0015`
separately.

## Implementation Notes

- Added the internal catalog contract at `docs/internal/api/catalog.md`.
- Added Prisma Client generation with API-owned ignored output, the PostgreSQL
  driver adapter, validated environment loading, and Nest-managed connection
  lifecycle.
- Added versioned published-comic list and slug-detail routes with stable DTOs,
  page-based pagination, EN/RU content selection, deterministic ordering, and
  Zod request validation.
- Added a shared API error envelope for validation, not-found, and unexpected
  server errors without exposing internal details.
- Added database-independent catalog service unit tests and read-only
  database-backed Supertest contract tests.
- Extended CI with PostgreSQL, migration, seed, and the separate API test gate.
- Synchronized architecture, catalog, testing, local development, governance,
  project brief, strategic plan, progress, and README documentation.
- No schema model, migration, seed, media, frontend, Swagger, planned bug, or
  unrelated health behavior was added or changed.

During local verification, host port `5432` was already occupied by a separate
Windows PostgreSQL service. The ignored local `.env` used `55432`; committed
Compose defaults were not changed.

## Verification Results

- `pnpm install --frozen-lockfile`: passed; postinstall generated Prisma Client.
- `pnpm db:generate`: passed; generated output is ignored by Git.
- `pnpm db:validate`: passed.
- Committed migration status and deterministic catalog seed: passed.
- `pnpm test`: passed, 3 suites and 7 tests.
- `pnpm test:api`: passed, 2 suites and 11 tests.
- Unit and API Jest discovery remain separate.
- Frontend and backend typechecks: passed.
- Frontend and backend builds: passed.
- Docker Compose configuration validation: passed.
- Local PostgreSQL health check: healthy.
- Compiled API smoke checks passed for health, EN/RU list reads, published
  count and order, slug detail, and unpublished not-found behavior.
- Final repository consistency and diff checks are recorded before the commit
  checkpoint.

## Risks and Open Questions

- Page-based pagination is intentionally simple and may be replaced for a
  genuinely large catalog, but that scale is outside the local MVP.
- A root `postinstall` generation command adds explicit lifecycle work. It is
  recommended so fresh installs cannot typecheck or build against a missing
  generated client.
- Generated client output inside the API source tree simplifies imports and
  Nest compilation but must remain ignored and regenerated from the schema.
- `pg` connection-pool defaults differ from older Prisma engine defaults.
  Production pool tuning is deferred; local and CI shutdown behavior must still
  be verified.
- `pnpm test:api` will no longer be database-independent after catalog contract
  tests are added. Local documentation and CI preparation must make that
  boundary explicit.
- Read-only API tests can safely share one seeded fixture. Any future write API
  requires a separate isolation and reset decision.
- Query locale is recommended for deterministic QA use, but future frontend
  route localization remains independent.
- Public Swagger is deliberately not generated here. Phase 5 must derive its
  public surface from the implemented behavior without exposing internal notes
  or planned bug spoilers.
