# Progress

## Current Phase

Phase 1 - Clean Comics Store core.

## Active Tasks

None.

## Done

- Documentation and governance foundation established.
- High-level product plan stored as a strategic reference.
- Initial planning questions resolved and recorded.
- Codex governance rules task completed.
- Task template added.
- Bug registry convention added.
- Product skeleton planning task completed.
- Repository infrastructure skeleton completed.
- Frontend React, Vite, and TypeScript skeleton completed.
- Backend NestJS and TypeScript skeleton completed with `GET /health`.
- Git repository baseline and first project foundation commit completed.
- Prisma PostgreSQL configuration skeleton completed without product models or
  database runtime.
- Docker Compose local runtime completed with a healthy PostgreSQL service,
  persistent named volume, and no product schema.
- Minimal GitHub Actions quality gates completed for frozen install, frontend
  and backend typechecks and builds, Prisma validation, and Compose validation.
- Documentation audit alignment completed across roadmap, architecture,
  governance, testing, catalog direction, and planned bug conventions.
- Phase 1 clean catalog domain plan completed with entity, business rule, seed,
  contract, test, and implementation boundaries.
- Clean catalog Prisma schema and initial PostgreSQL migration completed with
  normalized entities, stable mappings, indexes, and database integrity checks.
- Deterministic clean catalog seed completed with ten fictional comics,
  complete EN/RU content, stable fixtures, eight local covers, and one fallback.
- Backend test foundation completed with separate Jest unit and Supertest API
  health suites, root commands, and CI gates.
- Clean catalog read API and internal contract completed with versioned
  list/detail routes, Prisma PostgreSQL integration, stable EN/RU DTOs, Zod
  validation, shared errors, unit coverage, and database-backed API tests.

## Blocked

None.

## Decisions Accepted

- React + Vite frontend.
- NestJS backend.
- PostgreSQL + Prisma.
- Docker Compose local-first.
- Docker Compose is the primary MVP runtime; Podman compatibility will be
  evaluated in a separate future infrastructure task.
- pnpm workspaces preferred.
- No Turborepo or Nx at start.
- Document-first workflow.
- Clean Core + Bug Layer.
- Keep Phase 0 as documentation foundation only.
- Phase 1 includes a minimal deterministic clean catalog seed and repeatable
  reset path.
- Internal behavior/API contracts and relevant clean tests evolve with each
  feature instead of waiting for Phase 5 or Phase 8.
- Keep `docs/high-level-plan.md` as a strategic reference and promote accepted parts only when needed.
- Frontend libraries beyond React + Vite are deferred until approved feature
  tasks require them.
- Zod is the preferred backend DTO validation approach.
- MVP includes minimum checkout address only; full profile editing is later scope.
- MVP may include display-only discounted seed items, without promocodes.
- RU/EN-ready catalog content should use normalized translation records.
- Money should use integer minor units plus an ISO currency code.
- Display-only discounted catalog items may use an optional comparison price
  without introducing a discount engine.
- Clean catalog media should use stable local assets with a deterministic
  missing-media fallback.
- A Comic represents one sellable issue or standalone volume.
- Catalog creators, genres, series, and localized display text use normalized
  relations.
- Catalog entities use database-generated integer internal IDs, stable slugs,
  and stable comic SKUs.
- Standard clean catalog seed records include both EN and RU translations.
- The initial clean catalog seed uses only `USD`.
- Catalog publication states are `DRAFT`, `PUBLISHED`, and `ARCHIVED`; public
  reads expose only published comics.
- The first catalog read slice is paginated list plus slug detail. Search and
  filters follow through separate Phase 1 tasks.
- Clean seed titles, creators, descriptions, and covers are fictional and
  original or explicitly licensed.
- No separate `ux/` bug registry folder at the start; use existing categories plus metadata.
- Build a fully working clean app before planned bugs.
- Planned bugs should start as flag-controlled and disabled by default.
- Closed bug guide should be hybrid: registry as source of truth, manual hints as guide content.
- Internal API contract should be stored in the repository first, with a protected route later.
- First planned bug pack target is 5-10 bugs.
- Deployment preparation is in scope later; public demo follows after local MVP stability.
- Product skeleton implementation should be split into small tasks: repository infrastructure, frontend skeleton, backend skeleton, database/Prisma skeleton, local runtime wiring, and CI quality gates.
- First implementation task should be repository infrastructure skeleton.
- Repository infrastructure skeleton should create workspace files and empty root folders needed for workspace layout.
- Frontend setup should defer React Router, TanStack Query, React Hook Form, frontend Zod, and i18n until approved feature tasks need them.
- Backend setup should defer Swagger dependencies until API contract or docs work needs them.
- Prisma product schema should wait until the first product data model.
- CI should wait until real lint, typecheck, or test commands exist.
- Root package manager is pinned to pnpm `11.17.0`.
- Frontend runtime is pinned to React `19.2.8` and React DOM `19.2.8`.
- Frontend build foundation uses Vite `8.1.5` and TypeScript `7.0.2`.
- Backend runtime uses NestJS `11.1.28` with the Express adapter.
- Backend build foundation uses NestJS CLI `11.0.24` and TypeScript `5.9.3`.
- Platform health endpoint is `GET /health` with `{ "status": "ok" }`.
- Backend request validation uses Zod `4.4.3`.
- Swagger dependencies remain deferred until public/internal API documentation
  work.
- Git commits require an explicit human checkpoint after each completed task or
  implementation step.
- Compatible completed steps may be grouped into one commit after human
  approval.
- Task behavior type follows primary intent. A directly supporting product
  migration may remain in an explicitly scoped Clean Feature task.
- Git uses `main` as the initial branch.
- Repository text files are normalized to LF through `.gitattributes`.
- Prisma CLI is pinned to `7.9.0` with dotenv `17.4.2`.
- Prisma remains root-level until generated client sharing justifies a dedicated
  database workspace.
- Prisma Client `7.9.0`, the PostgreSQL adapter, and `pg` are owned by the API;
  generated client output remains ignored and schema-derived.
- pnpm lifecycle scripts are allowed only for the pinned `prisma` and
  `@prisma/engines` packages; unreviewed package scripts remain blocked.
- The CI quality job uses CI-local PostgreSQL, committed migrations, and the
  deterministic clean catalog seed for read-only API tests.
- GitHub Actions dependencies are pinned to immutable release commit SHAs.
- CI lint remains deferred; backend unit and API test gates are active.
- An in-app protected bug guide does not hide repository-backed registry
  spoilers from repository readers.
- The approved catalog implementation sequence starts with `0012` - Catalog
  Domain Schema and Initial Migration.
- Catalog translations and join records use composite primary keys.
- Catalog database names use explicit snake_case mappings.
- Catalog timestamps use `timestamptz(3)`.
- PostgreSQL check constraints enforce clean identity, money, stock,
  non-blank text, sort order, and series/issue invariants.
- Prisma Client uses the Prisma 7 `prisma-client` generator with output under
  `apps/api/src/generated/prisma`.
- The initial catalog seed uses transactional SQL through explicit
  `prisma db seed` and adds no runtime database dependency.
- Catalog seed replacement truncates only the explicit catalog table set,
  restarts identities, and does not use `CASCADE`.
- The clean fixture contains exactly 10 comics: 8 published, 1 draft, and 1
  archived.
- Clean catalog media uses original generated 1024 by 1536 PNG assets stored in
  the frontend public directory.
- Backend unit tests use Jest 29 with ts-jest 29.
- Backend API tests use Jest and Supertest in a separate database-backed suite.
- `pnpm test` and `pnpm test:api` are separate root commands and CI gates.
- Backend unit tests remain database-independent.
- The clean product API routes are `GET /api/v1/comics` and
  `GET /api/v1/comics/:slug`; `GET /health` remains outside the product API.
- Catalog reads use page-based pagination with defaults `1/12`, maximum page
  size `50`, and an explicit `en|ru` query locale defaulting to `en`.
- Catalog API responses use stable DTOs, integer minor-unit money, observable
  locale fallback, deterministic relation ordering, and shared JSON errors.
- Database-backed API tests use the migrated deterministic seed and remain
  read-only after preparation.

## Decisions Still Pending

- UI kit.
- Exact auth implementation details.
- Deployment target.
- Frontend unit, Playwright E2E, contract, and k6 command structure.
- Exact search semantics and filter query syntax.
- Repository visibility and the spoiler threat model for registry content.
