# Architecture Notes

The frontend and backend foundations now exist. This document records the
current structure and the intended next architecture steps.

## Monorepo Structure

The project uses a lightweight monorepo:

```text
apps/
  web/                 # React/Vite localized catalog foundation
  api/                 # NestJS clean catalog API
packages/
  shared/              # planned when justified
docs/
bug-registry/
tests/
prisma/                # catalog schema, migrations, and clean seed
prisma.config.ts       # Prisma CLI configuration exists
compose.yaml           # local PostgreSQL runtime
```

Repository areas:

- `apps/web`: React, Vite, and TypeScript frontend.
- `apps/api`: NestJS, Express, and TypeScript backend.
- `packages/shared`: Shared types or utilities when they remove duplication.
- `docs`: Project docs, ADRs, and task files.
- `bug-registry`: Repository-backed planned bug definitions.
- `tests`: Cross-application test assets when needed.
- `prisma`: Prisma schema, migration history, and clean catalog seed data.

## Current Database Foundation

Prisma `7.9.0` is configured at the repository root with PostgreSQL as its
datasource provider. The datasource URL is read from `DATABASE_URL` through
`prisma.config.ts`.

The current database layer contains:

- The clean catalog models and relations defined in `docs/product/catalog.md`.
- One initial `catalog_foundation` migration.
- One explicit transactional catalog seed configured through Prisma CLI.
- Explicit snake_case database mappings.
- PostgreSQL checks for clean catalog data invariants.
- Prisma ORM 7 `prisma-client` generator with API-owned ignored output.
- Prisma PostgreSQL driver adapter and API-owned database provider.
- Zod validation for `DATABASE_URL`.

Migrations live under `prisma/migrations/`. The clean catalog seed lives at
`prisma/seed/catalog.sql`. The first migration represents the real catalog
product model rather than an infrastructure probe table.

Generated Prisma Client code lives under
`apps/api/src/generated/prisma/`. It is derived from the repository schema,
ignored by Git, and regenerated during dependency installation or with
`pnpm db:generate`. Database access remains owned by `apps/api`; generated
database types are not exposed through `packages/shared`.

## Catalog Foundation Direction

`docs/product/catalog.md` is the clean catalog domain source for schema, seed,
API, and UI implementation.

The approved first model boundary contains:

- `Comic` as one sellable issue or standalone volume.
- Normalized `ComicTranslation`, `Series`, `SeriesTranslation`, `Creator`,
  `ComicCreator`, `Genre`, `GenreTranslation`, and `ComicGenre` records.
- Database-generated integer internal IDs plus stable slugs and comic SKUs.
- EN and RU translations for every standard clean seed item.
- Integer minor-unit money with an ISO currency code and optional comparison
  price.
- Non-negative stock and explicit `DRAFT`, `PUBLISHED`, and `ARCHIVED` states.
- Stable local cover assets and a deterministic missing-cover fallback.
- Explicit merchandising order with an internal ID tie-breaker.

The implemented PostgreSQL boundary uses:

- Closed `en` and `ru` locale values.
- Composite primary keys for translations and catalog join records.
- `timestamptz(3)` domain timestamps.
- A unique series and issue-number pair.
- A read index on publication state, merchandising order, and comic ID.
- Custom checks for identity formats, non-blank display text, valid money and
  stock, and consistent standalone versus series issues.

The clean fixture contains ten fictional comics, three series, eight creators,
six localized genres, and complete EN/RU catalog translations. It is replaced
transactionally through explicit catalog-table truncation without `CASCADE`.
Stable fixture identity comes from slug and SKU, not generated integer IDs.

Eight comic cover files and one deterministic fallback are repository-owned
PNG assets under `apps/web/public/media/comics/`. Clean catalog behavior does
not depend on third-party media.

The first read slice implements paginated published list plus slug detail.
Search and filters remain separate Phase 1 Clean Features after list/detail
behavior is stable.

The approved sequence is schema and migration, clean seed and local media,
backend test foundation, catalog API and internal contract, frontend
foundation, then list/detail UI. The first five steps are implemented.

## Catalog API Boundary

The clean catalog API is implemented inside `apps/api/src/catalog/`:

- `GET /api/v1/comics`
- `GET /api/v1/comics/:slug`

`docs/internal/api/catalog.md` is the internal contract. The API:

- Returns only published comics.
- Uses page-based pagination.
- Selects EN or RU content through an explicit query locale.
- Uses EN as an observable per-entity fallback.
- Maps Prisma results to stable product DTOs.
- Preserves integer minor-unit money and nullable cover paths.
- Applies deterministic comic, creator, and genre ordering.
- Uses Zod request validation and a shared JSON error envelope.

The public DTO boundary does not expose numeric database IDs, publication
state, merchandising order, timestamps, or raw translation records. Public
Swagger/OpenAPI remains Phase 5 scope.

`apps/api/src/database/` owns Prisma Client construction and lifecycle. The
PostgreSQL adapter reads the validated repository-local `DATABASE_URL` and
disconnects when Nest closes.

## Frontend Catalog Foundation

The frontend uses explicit localized product routes:

- `/en/comics`
- `/ru/comics`
- `/en/comics/:slug`
- `/ru/comics/:slug`

React Router owns navigation, route errors, root redirect, and not-found
behavior. The active route locale controls i18next resources, document language,
document title, and the API `locale` query. Unsupported locale prefixes do not
silently fall back.

TanStack Query owns catalog server state. One frontend API module uses
same-origin `/api` requests, passes request cancellation to `fetch`, and maps
network, HTTP, cancellation, and response-contract failures into explicit
frontend errors. Vite proxies `/api` to the validated local
`VITE_API_PROXY_TARGET`; production output assumes equivalent same-origin
routing.

Frontend-owned Zod schemas mirror the internal catalog DTO contract and reject
incompatible successful responses before presentation components receive them.
They do not import generated Prisma types or create a shared package.

Frontend markup follows `docs/conventions/frontend-testability.md`.
Accessibility semantics are the primary automation surface; limited stable
test IDs identify only shell and asynchronous route states where needed.

## Incremental Contracts and Tests

Internal behavior and API contracts are written with the clean features they
specify. The catalog contract is covered by service unit tests and read-only
Supertest API tests against the deterministic PostgreSQL seed. Vitest and
Testing Library cover frontend routes, locale synchronization, catalog
contract parsing, request behavior, query identity, and safe error states.

Phase 5 publishes and consolidates public and internal API documentation. It
does not postpone the first internal contract until after APIs exist. Phase 8
expands automation coverage and training readiness; it does not postpone all
product tests until the end of the clean application.

## Clean Core + Bug Layer

The clean core is the correct comics store behavior. It should be implemented first and covered by tests.

The bug layer is the controlled mechanism for planned educational bugs. Planned bugs should be enabled through explicit configuration, flags, or scenario controls rather than random defects.

Clean core code and bug layer behavior should be easy to reason about separately.

## Bug Flags

Planned bugs should support environment or configuration-based flags where practical. The exact flag model is pending. The intended properties are:

- Predictable local behavior.
- Easy enable and disable paths.
- Clear mapping to bug registry IDs.
- No platform health regressions.

## API Documentation Separation

The project will keep two API documentation audiences:

- Public training API docs: Swagger/OpenAPI exposed for QA practice.
- Internal developer API contract: implementation-facing behavior, validation, errors, and versioning notes.

Public training docs must not leak closed bug guide details.

## Current Platform Health Contract

The backend skeleton exposes:

- `GET /health`
- HTTP `200`
- JSON response `{ "status": "ok" }`

This endpoint is platform infrastructure, not a training API exercise. It should
remain outside future product API prefixes and must stay healthy when planned
bugs are introduced.

## Local-First Runtime

The local runtime uses Docker Compose with one PostgreSQL service based on
`postgres:18.4-alpine`. PostgreSQL data persists in a Compose-managed named
volume mounted at `/var/lib/postgresql`. The database is published on a
configurable host port and reports readiness through `pg_isready`.

The frontend and backend continue to run directly through documented pnpm
commands. The API owns the generated Prisma Client and PostgreSQL adapter
integration. Application containers remain future approved task scope.

Docker Compose is the primary supported runtime for the MVP. The Compose file
avoids unnecessary Docker-specific configuration, but Podman compatibility is
not yet supported or verified and requires a separate infrastructure task.
