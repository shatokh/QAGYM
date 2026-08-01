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
- The auth persistence models defined in
  `docs/product/auth-roles-demo-scenarios.md`.
- One initial `catalog_foundation` migration.
- One `auth_foundation` migration.
- One explicit transactional catalog seed configured through Prisma CLI.
- Deterministic demo auth seed records owned by the same reset command.
- Explicit snake_case database mappings.
- PostgreSQL checks for clean catalog data invariants.
- PostgreSQL checks for clean auth identity, email, password hash, and session
  timestamp invariants.
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
six localized genres, complete EN/RU catalog translations, two enabled demo
auth accounts, and no preexisting sessions. It is replaced transactionally
through explicit table truncation without `CASCADE`. Stable catalog fixture
identity comes from slug and SKU, and stable auth fixture identity comes from
public user ID and email, not generated integer IDs.

Eight comic cover files and one deterministic fallback are repository-owned
PNG assets under `apps/web/public/media/comics/`. Clean catalog behavior does
not depend on third-party media.

The first read slice implements paginated published list plus slug detail.
Search and filters are implemented as a separate Phase 1 Clean Feature after
list/detail behavior.

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

## Auth API and Session Boundary

The Phase 2 backend auth API is implemented in `apps/api/src/auth/`. The
internal contract is `docs/internal/api/auth.md`, and the persistence
foundation is implemented in Prisma.

The accepted architecture direction is:

- Guest is unauthenticated state, not a database role.
- Initial account roles are `USER` and `ADMIN`.
- Each MVP account has exactly one role.
- Browser auth uses a database-backed opaque session token.
- Session tokens are generated with a cryptographically secure random number
  generator and at least `128` bits of entropy.
- The browser receives the session identifier in an HTTP-only SameSite cookie
  named `qcg_session`.
- Future HTTPS deployment should use the host-prefixed cookie name
  `__Host-qcg_session`.
- The database stores only a hash of the session token.
- Raw session tokens, password hashes, and numeric database IDs are not exposed
  through auth DTOs.
- `GET /api/v1/auth/me` is the stable current-user endpoint.
- Login returns the current user DTO and sets the session cookie.
- Login returns the same `INVALID_CREDENTIALS` response for unknown email,
  wrong password, disabled account, and locked account states.
- Login includes process-local throttling for the first local MVP backend
  slice: `10` failed attempts per normalized email per `10` minutes and `100`
  failed attempts per source per `10` minutes.
- Logout is idempotent and clears the session cookie.
- The recommended initial session lifetime is an `8` hour absolute timeout and
  a `30` minute idle timeout.
- Password verification uses the npm package `argon2` with Argon2id hashes.
- Multiple active sessions per account are allowed in the first backend slice.

The implemented auth persistence boundary contains:

- `User` with stable public ID, normalized unique email, password hash, display
  name, role, enabled state, and timestamps.
- `Session` with user relationship, unique token hash, expiration timestamp,
  last-seen timestamp, creation timestamp, and optional revoked timestamp.
- `UserRole` enum with `USER` and `ADMIN`.
- Constraints for public ID format, normalized email, non-blank hashes and
  names, session expiration, last-seen, and revoked timestamp consistency.

The implemented auth API boundary contains:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- Zod validation for JSON login/logout request bodies.
- Manual cookie parsing/serialization without an additional cookie dependency.
- Shared JSON error envelopes for invalid request, invalid credentials,
  unauthenticated state, and auth throttling.

The first backend auth implementation task must explicitly approve the password
hashing dependency, session token hashing details, cookie parsing behavior, and
login throttling strategy before code is added.

The current CSRF posture is intentionally narrow: SameSite `Lax` is required
for the first local login/logout slice, but SameSite is not treated as the full
CSRF strategy for future authenticated writes. The first authenticated
state-changing product API beyond login/logout must revisit CSRF protection in
its own approved task.

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
