# Task 0008: Local Runtime Wiring

## Status

Done

## Behavior Type

Infrastructure

## Background

The frontend and backend run directly through pnpm, and Prisma is configured for
PostgreSQL without product models or API integration. The next step is a
predictable local PostgreSQL runtime through Docker Compose.

Docker Compose is the primary supported local runtime for the MVP. Podman
compatibility is deferred to a separate future infrastructure task so that its
machine setup and Compose behavior can be verified without expanding this task.

This task should provide the database service needed by future model, migration,
seed, and API integration tasks. It must not containerize the applications or
introduce database behavior before a real product model is approved.

The local environment currently reports Docker CLI `29.1.2` and Docker Compose
`2.40.3`. Docker daemon availability and image pull access must be verified
during implementation.

Relevant references:

- `docs/tasks/0002-product-skeleton-planning.md`
- `docs/tasks/0007-local-database-prisma-skeleton.md`
- `docs/adr/ADR-0002-postgres-prisma.md`
- `docs/architecture.md`
- `docs/local-development.md`
- `AGENTS.md`: local-first, no hidden dependencies, and scope lock.

## Scope

- Add a root `compose.yaml`.
- Add one Docker Compose service named `postgres`.
- Use the Docker Official Image `postgres:18.4-alpine`.
- Configure local demo database values through Compose interpolation:
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
  - `POSTGRES_PORT`
- Extend `.env.example` with the non-secret local demo values used by Compose.
- Keep `.env` ignored and untracked.
- Publish PostgreSQL on configurable host port `POSTGRES_PORT`, defaulting to
  `5432`.
- Add a named volume for PostgreSQL data at `/var/lib/postgresql`, matching the
  PostgreSQL 18 official image layout.
- Add a PostgreSQL healthcheck using `pg_isready`.
- Do not set `container_name`, allowing Compose project isolation.
- Do not add an automatic restart policy for the local-only service.
- Add root scripts:
  - `infra:up`
  - `infra:down`
  - `infra:status`
  - `infra:logs`
- Validate the Compose configuration.
- Start PostgreSQL and verify health and a read-only `SELECT 1`.
- Verify the host port is reachable.
- Verify frontend and backend remain runnable while PostgreSQL is available.
- Update current status, architecture notes, and local development
  documentation after implementation.

## Proposed Compose Shape

The implementation should follow this structure:

```yaml
services:
  postgres:
    image: postgres:18.4-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

volumes:
  postgres_data:
```

Equivalent syntax may be used if `docker compose config` normalizes the file.
Any additional service or runtime setting requires an approved amendment.

## Environment Direction

The committed `.env.example` should include:

```dotenv
POSTGRES_USER=qa_gym
POSTGRES_PASSWORD=qa_gym
POSTGRES_DB=qa_comics_gym
POSTGRES_PORT=5432
DATABASE_URL="postgresql://qa_gym:qa_gym@localhost:5432/qa_comics_gym?schema=public"
```

These are intentionally non-secret local demo credentials. They must never be
presented as production credentials.

If `POSTGRES_PORT` changes, the local `DATABASE_URL` must use the same host
port.

## Approved Runtime Boundary

This task introduces:

- Docker Compose configuration.
- Docker Official Image `postgres:18.4-alpine`.
- One named Docker volume managed by Compose.

No npm or pnpm dependency is added.

## Recommended Setup Decisions

- Use `compose.yaml`, the current standard Compose filename.
- Pin the PostgreSQL minor version instead of using `latest`.
- Use PostgreSQL 18's `/var/lib/postgresql` volume path.
- Keep apps on the host until production-style containerization has an explicit
  task.
- Require local environment values rather than committing a real `.env`.
- Keep `infra:down` non-destructive: it must not remove the named volume.
- Do not add reset or volume-deletion scripts.
- Do not add Adminer, pgAdmin, Redis, queues, mail services, or observability
  tools.

## Out of Scope

- Frontend or backend Dockerfiles.
- Frontend or backend Compose services.
- Production container images or deployment configuration.
- Prisma Client generation.
- PostgreSQL driver or adapter dependencies.
- NestJS database integration.
- Product models, migrations, tables, or schema deployment.
- Seed scripts, seed data, or demo accounts.
- Creating a probe table for runtime verification.
- Database reset, volume deletion, or destructive scripts.
- Adminer, pgAdmin, or another database UI.
- Redis, queues, object storage, mail services, or observability.
- API behavior or API contract changes.
- Automated tests or CI integration.
- Planned bugs or bug registry entries.

## Acceptance Criteria

- `compose.yaml` defines only the `postgres` service and its named volume.
- The service uses `postgres:18.4-alpine`.
- PostgreSQL environment values come from local Compose interpolation.
- `.env.example` contains consistent non-secret local demo values.
- `.env` remains ignored and untracked.
- Host port defaults to `5432` and can be overridden.
- PostgreSQL data uses a named volume mounted at `/var/lib/postgresql`.
- The service has a passing `pg_isready` healthcheck.
- `docker compose config` validates successfully with the example environment.
- PostgreSQL reaches healthy state.
- `SELECT 1` succeeds without creating application tables.
- The published host port is reachable.
- Prisma schema validation still passes with the local `DATABASE_URL`.
- Backend `GET /health` still returns HTTP `200` while PostgreSQL is running.
- Frontend and backend typechecks still pass.
- No model, migration, seed, application container, database UI, or
  out-of-scope service is added.
- `infra:down` stops the service without deleting the named volume.
- Documentation matches the implemented runtime and commands.

## Verification Plan

- Verify Docker daemon and Compose availability.
- Run `docker compose --env-file .env.example config`.
- Start PostgreSQL with the approved environment values.
- Wait for the Compose health status to become `healthy`.
- Run `pg_isready` inside the service.
- Run read-only `SELECT 1` through `psql` inside the service.
- Check the configured host port from the host.
- Run `corepack pnpm db:validate` with the matching `DATABASE_URL`.
- Run frontend and backend typechecks.
- Start or inspect backend health and verify `GET /health` returns HTTP `200`.
- Inspect `docker compose ps`.
- Run the non-destructive down command and verify the service stops.
- Verify the named volume still exists after shutdown.
- Verify no application table, migration, seed, or extra service was created.

No automated test framework is introduced in this task.

## Documentation Impact

Update after implementation:

- `README.md`
- `PROGRESS.md`
- `docs/architecture.md`
- `docs/local-development.md`

## API Contract Impact

None. The API remains independent of PostgreSQL in this task. `GET /health`
continues to report application process health only.

## Seed Data Impact

None.

## Test Impact

- Health tests: manual infrastructure verification for PostgreSQL readiness,
  host port availability, and existing API health.
- Clean core behavior tests: none.
- Bug verification tests: none.
- Contract tests: none.
- Performance smoke tests: none.

## Bug Registry Impact

None.

## Dependencies

- Docker Engine or Docker Desktop.
- Docker Compose v2.
- Network access to pull `postgres:18.4-alpine` if it is not cached.

Podman is not a supported runtime in this task.

No project package dependency is added.

## Commit Decision

Pending human decision.

## Implementation Notes

- Added `compose.yaml` with one `postgres:18.4-alpine` service.
- Added interpolated local database settings, a configurable host port,
  `pg_isready` healthcheck, and the `postgres_data` named volume.
- Added root `infra:up`, `infra:down`, `infra:status`, and `infra:logs` scripts.
- Kept frontend and backend execution on the host.
- Documented Docker Compose as the primary MVP runtime and deferred Podman
  compatibility to a separate future infrastructure task.
- Added no product model, migration, seed, generated client, database adapter,
  application container, or additional service.

Verification completed:

- Docker Engine `29.1.2` and Docker Compose `2.40.3` were available.
- `docker compose --env-file .env.example config` passed.
- The official PostgreSQL image was pulled and reached `healthy` state.
- `pg_isready` reported that PostgreSQL accepted connections.
- Read-only `SELECT 1` succeeded.
- Host port `5432` was reachable.
- The database contained no application tables.
- `corepack pnpm db:validate` passed with the matching local URL.
- Frontend and backend typechecks passed.
- The frontend returned HTTP `200` while PostgreSQL was running.
- Backend `GET /health` returned HTTP `200` with `{ "status": "ok" }` while
  PostgreSQL was running.
- The root `infra:up`, `infra:status`, and `infra:down` scripts were exercised.
- `infra:down` removed the container and network without deleting
  `qagym_postgres_data`.
- The verification PostgreSQL container was stopped after testing.

## Risks and Open Questions

- Port `5432` may already be occupied. `POSTGRES_PORT` provides an approved
  override path.
- Pulling the image may require Docker registry authentication or network
  access.
- PostgreSQL 18 changed the official image's data volume layout. Mounting the
  named volume at `/var/lib/postgresql` avoids the older path mismatch.
- Database persistence is configured but not validated by creating application
  tables because product models remain out of scope.
- The API does not depend on database readiness yet; that integration needs a
  future approved task.
- Podman may run the same Compose file, but compatibility is intentionally
  unverified until a separate approved task.
