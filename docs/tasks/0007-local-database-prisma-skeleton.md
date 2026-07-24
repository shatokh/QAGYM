# Task 0007: Local Database and Prisma Skeleton

## Status

Done

## Behavior Type

Infrastructure

## Background

The frontend and backend application skeletons are complete. The next product
foundation step is to establish Prisma's PostgreSQL configuration without
introducing product models or requiring a running database before the local
Docker runtime task.

The current Prisma architecture uses `prisma.config.ts` for datasource
configuration. Prisma Client integration also requires a generated client,
explicit output path, PostgreSQL driver adapter, and database driver. Those
runtime pieces are not needed until the first approved product model and API
database integration task.

Relevant references:

- `docs/tasks/0002-product-skeleton-planning.md`
- `docs/adr/ADR-0002-postgres-prisma.md`
- `docs/architecture.md`
- `PROJECT_BRIEF.md`
- `AGENTS.md`: scope lock, no hidden dependencies, and seed data rules.

## Scope

- Add the Prisma CLI foundation at the repository root.
- Add a root `prisma.config.ts`.
- Add `prisma/schema.prisma`.
- Configure the Prisma datasource provider as PostgreSQL.
- Read `DATABASE_URL` from local environment configuration.
- Add a committed `.env.example` containing a non-secret local PostgreSQL
  connection template.
- Keep `.env` ignored and untracked.
- Add root scripts:
  - `db:validate`
  - `db:format`
- Update `pnpm-lock.yaml`.
- Document where future Prisma migrations, generated client output, and seed
  scenarios are expected to live.
- Update current status, architecture notes, and local development documentation
  after implementation.

## Proposed File Set

The implementation is expected to create:

- `prisma.config.ts`
- `prisma/schema.prisma`
- `.env.example`

The implementation may add empty tracked directories only when they are needed
to preserve an explicitly documented future location.

## Approved Dependency Boundary

Root development dependencies:

- `prisma`
- `dotenv`

Exact compatible versions must be selected and recorded in `package.json` and
`pnpm-lock.yaml` during implementation. No other direct dependency may be added
without an approved amendment.

## Recommended Setup Decisions

- Keep Prisma configuration and schema under the repository root, matching the
  current architecture notes.
- Use the current stable Prisma configuration model with
  `prisma.config.ts`.
- Configure PostgreSQL as the datasource but do not require a running database
  for schema validation.
- Do not add product models or a temporary probe model.
- Do not add a Prisma Client generator until the first product data model is
  approved.
- Do not add `@prisma/client`, `@prisma/adapter-pg`, `pg`, or `@types/pg` until
  API database integration is implemented.
- Do not create an empty baseline migration. The first migration should describe
  a real approved product model.
- Keep Docker Compose and the actual local PostgreSQL service in task `0008`.
- Keep future seed scenarios under `prisma/seed/` unless a later approved task
  establishes a more suitable structure.

## Alternatives Considered

### Standalone `packages/database` Workspace

This is useful once generated Prisma Client code and database access need to be
shared. It is premature while only the API will use the database and no product
model exists. Adopting it now would also change the current architecture.

### Add PostgreSQL Docker Runtime Now

This would allow immediate connection and migration verification, but it would
mix Prisma configuration with task `0008` local runtime wiring.

### Add a Temporary Probe Model

This would prove migration execution, but it would create a database object that
has no product purpose and would violate the accepted decision to wait for the
first real product model.

## Out of Scope

- Running PostgreSQL.
- Docker Compose or container configuration.
- Prisma Client generation.
- `@prisma/client`.
- PostgreSQL driver adapters or `pg`.
- NestJS database modules, services, providers, or health integration.
- Product models, including users, comics, carts, orders, or probe tables.
- Migrations or database schema deployment.
- Seed scripts, seed data, or demo scenarios.
- Prisma Studio scripts.
- Database reset or destructive database commands.
- API behavior or API contract changes.
- Tests or CI integration.
- Planned bugs or bug registry entries.

## Acceptance Criteria

- `prisma.config.ts` exists and points to `prisma/schema.prisma`.
- Prisma configuration reads `DATABASE_URL` without embedding credentials.
- `.env.example` contains a non-secret local PostgreSQL URL template.
- `.env` remains ignored and untracked.
- The schema datasource provider is `postgresql`.
- The schema contains no product or probe models.
- No Prisma Client generator or generated client exists.
- `db:validate` successfully validates the schema when `DATABASE_URL` is set to
  a syntactically valid PostgreSQL URL.
- `db:format` formats the schema without creating unrelated changes.
- No running PostgreSQL service is required for validation.
- No migration, seed data, database integration, or out-of-scope dependency is
  added.
- Documentation matches the implemented paths and commands.

## Verification Plan

After dependency installation:

- Set `DATABASE_URL` to a non-secret syntactically valid local PostgreSQL URL for
  the verification process.
- Run `corepack pnpm db:validate`.
- Run `corepack pnpm db:format`.
- Run `corepack pnpm db:validate` again.
- Verify formatting leaves no unexpected source diff.
- Verify `.env` is ignored.
- Verify the root manifest contains only the approved new direct dependencies.
- Verify no generated client, migration, model, seed file, or PostgreSQL runtime
  file was added.
- Re-run existing frontend and backend typechecks to detect workspace
  regressions.

No database connection or migration command is expected in this task.

## Documentation Impact

Update after implementation:

- `README.md`
- `PROGRESS.md`
- `docs/architecture.md`
- `docs/local-development.md`

## API Contract Impact

None. This task does not change API behavior or the health endpoint.

## Seed Data Impact

No seed data is created or changed. The task documents `prisma/seed/` as the
proposed future location only.

## Test Impact

- Health tests: no behavior change.
- Clean core behavior tests: none.
- Bug verification tests: none.
- Contract tests: none.
- Performance smoke tests: none.

This task uses Prisma validation and existing workspace typechecks as
infrastructure verification, not automated product tests.

## Bug Registry Impact

None.

## Dependencies

This task introduces only:

- `prisma`
- `dotenv`

Implementation requires package registry access with valid TLS verification.
A running PostgreSQL service is not required.

## Commit Decision

Commit after this task. The user approved a dedicated commit after combined
planning and implementation verification.

## Implementation Notes

- Added Prisma CLI `7.9.0` and dotenv `17.4.2` as root development
  dependencies.
- Added `prisma.config.ts`, PostgreSQL `prisma/schema.prisma`, and a non-secret
  `.env.example`.
- Added root `db:validate` and `db:format` commands.
- Added no model, generator, generated client, migration, seed, adapter, driver,
  API integration, or database runtime.
- Prisma's pinned preinstall and engine postinstall scripts were initially
  blocked by pnpm's strict dependency build policy.
- Reviewed the blocked package scripts and added explicit `allowBuilds` entries
  only for `prisma` and `@prisma/engines`. Global lifecycle script execution
  remains disabled.
- Added `.pnpm-store/` to `.gitignore` after pnpm created the local generated
  store.
- Updated current status, architecture notes, and local development
  documentation.

Verification completed:

- `corepack pnpm install` completed with the reviewed Prisma lifecycle scripts.
- `corepack pnpm db:validate` passed with a non-secret local PostgreSQL URL.
- `corepack pnpm db:format` completed successfully.
- A second `corepack pnpm db:validate` passed after formatting.
- Validation did not require a running PostgreSQL service.
- `.env` is ignored and untracked.
- Frontend and backend typechecks passed.
- Direct dependencies and source paths contain no Prisma Client, PostgreSQL
  adapter, driver, model, migration, or seed implementation.

## Risks and Open Questions

- The root-level Prisma layout is intentionally minimal. Moving generated client
  code into a dedicated database workspace later would require an approved
  architecture amendment.
- Real database connectivity remains unverified until task `0008` provides the
  PostgreSQL runtime.
