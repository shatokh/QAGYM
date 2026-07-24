# Architecture Notes

The initial frontend and backend application skeletons now exist. This document
records the current structure and the intended next architecture steps.

## Monorepo Structure

The project uses a lightweight monorepo:

```text
apps/
  web/                 # React/Vite skeleton exists
  api/                 # NestJS skeleton exists
packages/
  shared/              # planned when justified
docs/
bug-registry/
tests/
prisma/                # PostgreSQL schema foundation exists
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
- `prisma`: Prisma schema foundation, future migrations, and future seed data.

## Current Database Foundation

Prisma `7.9.0` is configured at the repository root with PostgreSQL as its
datasource provider. The datasource URL is read from `DATABASE_URL` through
`prisma.config.ts`.

The current schema intentionally has:

- No product models.
- No Prisma Client generator.
- No migrations.
- No seed implementation.
- No API database provider.

Future migrations should live under `prisma/migrations/`. Future seed scenarios
should live under `prisma/seed/` unless an approved task changes that structure.
The first migration must represent a real product model rather than an
infrastructure probe table.

## Catalog Foundation Direction

`docs/product/catalog.md` is the clean catalog domain source before schema and
API implementation.

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

The first read slice is paginated published list plus slug detail. Search and
filters remain separate Phase 1 Clean Features after list/detail behavior is
stable.

The approved proposed sequence is schema and migration, clean seed and local
media, backend test foundation, catalog API and internal contract, frontend
foundation, then list/detail UI. Each step still requires its own approved task.

## Incremental Contracts and Tests

Internal behavior and API contracts should be written with the clean features
they specify. Relevant clean behavior tests should be added when each feature
is implemented and the required test foundation exists.

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
commands. Application containers, Prisma Client integration, migrations, and
seed data remain future approved task scope.

Docker Compose is the primary supported runtime for the MVP. The Compose file
avoids unnecessary Docker-specific configuration, but Podman compatibility is
not yet supported or verified and requires a separate infrastructure task.
