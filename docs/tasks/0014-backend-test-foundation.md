# Task 0014: Backend Test Foundation

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24.
- Approved scope notes: All four recommendations were accepted: Jest 29 with
  ts-jest 29, separate unit and API suites, both CI gates added immediately,
  and database-independent health tests.

## Behavior Type

Infrastructure

The primary intent is to add backend test tooling, command structure, and CI
gates. The two health tests verify that the foundation works but do not add
product behavior.

## Background

The NestJS backend currently has one platform endpoint, `GET /health`, and no
test runner, Nest test module, Supertest integration, test scripts, or test CI
gate.

The next product task will implement catalog API behavior. Project governance
requires the supporting backend test foundation to exist first so clean API
behavior and future contract tests are added with the feature rather than
deferred.

This task should prove both isolated backend unit testing and in-memory HTTP API
testing without adding a database client, starting PostgreSQL, or introducing
catalog behavior.

Relevant references:

- `docs/testing-strategy.md`
- `docs/architecture.md`
- `docs/tasks/0013-clean-catalog-seed-and-local-media.md`
- `AGENTS.md`
- NestJS testing fundamentals

## Goal

Establish a small, explicit, CI-enforced backend testing foundation that future
clean feature and API contract tasks can extend.

## Proposed Decisions

These decisions become scope-locked only after human approval.

### Test Runner and TypeScript Transformer

Use Jest with ts-jest:

- `jest` `29.7.0`.
- `ts-jest` `29.4.12`.
- `@types/jest` `29.5.14`.

Jest 29 is recommended instead of the current Jest 30 release because the
current stable ts-jest line remains 29.x. This keeps TypeScript decorator and
metadata compilation aligned with the backend's existing TypeScript compiler
without adding SWC/Babel tooling or lifecycle binaries.

Do not use Vitest for the initial NestJS backend foundation. The frontend may
still choose Vitest later.

### Nest and HTTP Test Tools

Add backend dev dependencies:

- `@nestjs/testing` `11.1.28`, matching the current Nest runtime packages.
- `supertest` `7.2.2`.
- `@types/supertest` `7.2.1`.

Do not add a live-server test client. Supertest should exercise the Nest
application in memory through `app.getHttpServer()` and an ephemeral listener.

### Test Levels and Locations

Use two explicit backend suites:

- Unit tests colocated with source as `apps/api/src/**/*.spec.ts`.
- In-memory HTTP API tests under `apps/api/test/**/*.api-spec.ts`.

Create:

- `apps/api/src/health/health.controller.spec.ts`.
- `apps/api/test/health.api-spec.ts`.
- Separate Jest config files for unit and API suites.
- `apps/api/tsconfig.spec.json` covering source and test files with Jest types.

Do not call the Supertest suite browser E2E. `test:e2e` remains reserved for
future Playwright end-to-end workflows.

### Command Structure

Add backend package commands:

- `test`: run backend unit tests once.
- `test:watch`: run backend unit tests in watch mode.
- `test:api`: run in-memory backend API tests once.

Add root commands:

- `pnpm test`: run package unit tests; initially this resolves to the backend
  unit suite.
- `pnpm test:api`: run the backend API suite.

Both non-watch commands should run in-band for deterministic initial behavior
and reliable Nest application cleanup. Coverage commands and thresholds remain
deferred until meaningful product behavior exists.

### Initial Health Tests

The unit test should:

- Instantiate `HealthController` without starting Nest.
- Assert exact clean result `{ status: "ok" }`.

The API test should:

- Compile `AppModule` with `@nestjs/testing`.
- Create and initialize a Nest application.
- Send `GET /health` through Supertest.
- Assert HTTP `200`.
- Assert JSON content type.
- Assert exact body `{ "status": "ok" }`.
- Close the Nest application in teardown even when assertions fail.

The test must not bind application port `3000`, access the network, require
Docker, connect to PostgreSQL, or alter seed data.

### CI Gates

Update the existing quality workflow with separate named steps:

- Backend unit tests: `pnpm test`.
- Backend API tests: `pnpm test:api`.

Keep these in the existing read-only quality job. Do not add a PostgreSQL
service because the approved health suites do not require a database.

Future catalog API work may amend CI with database-backed integration tests
when the database provider and fixture isolation strategy exist.

## Scope

- Add the six approved backend test dev dependencies with exact pinned
  versions.
- Update `pnpm-lock.yaml`.
- Add backend unit, watch, and API test scripts.
- Add root unit and API test scripts.
- Add `apps/api/tsconfig.spec.json`.
- Add separate Jest unit and API configuration files under `apps/api/test/`.
- Add the health controller unit test.
- Add the in-memory health API test.
- Add separate backend unit and API steps to GitHub Actions.
- Update testing strategy and local development documentation with real
  commands and boundaries.
- Update `AGENTS.md` so `pnpm test` and `pnpm test:api` are no longer described
  as unavailable placeholders.
- Update `PROGRESS.md` and this task with implementation and verification
  results.

## Out of Scope

- Production application behavior changes.
- Catalog API, service, repository, DTO, contract, or tests.
- Prisma Client generator, adapter, PostgreSQL driver, or backend database
  provider.
- Database-backed test setup, migrations, seed execution, transaction rollback,
  or fixture isolation.
- Starting Docker Compose or PostgreSQL in tests or CI.
- Frontend unit test setup or Vitest.
- Playwright and `test:e2e`.
- k6 and performance smoke tests.
- Public Swagger/OpenAPI or internal catalog API contract.
- Coverage thresholds or a coverage CI gate.
- Snapshot tests.
- Watch mode in CI.
- Planned bug verification infrastructure or bug flags.
- Refactoring application bootstrap or unrelated backend code.

## Acceptance Criteria

- Only the six approved test dev dependencies are added.
- Dependency versions are exact and the lockfile is updated.
- `pnpm test` runs the backend unit suite and passes.
- `pnpm test:api` runs the in-memory backend API suite and passes.
- Unit and API test discovery are separate and cannot silently run each other's
  files.
- The health unit test asserts the exact controller result.
- The health API test asserts status, JSON content type, and exact body.
- The API test initializes and closes its Nest application cleanly.
- Tests do not require a fixed port, network access, PostgreSQL, Docker, Prisma,
  or seed data.
- Existing frontend/backend typechecks and builds still pass.
- CI runs separate named backend unit and API test gates.
- Testing documentation distinguishes Jest backend tests from future frontend,
  Playwright, database, and k6 suites.
- No catalog behavior, API contract, schema, migration, seed, UI, planned bug,
  or unrelated refactor is added.

## Verification Plan

- Install only the approved exact dev dependencies with pnpm.
- Inspect lockfile changes for unexpected direct dependencies or lifecycle
  requirements.
- Run `pnpm test`.
- Run `pnpm test:api`.
- Run each backend package test command directly.
- Verify unit config does not discover `*.api-spec.ts`.
- Verify API config does not discover source `*.spec.ts`.
- Run frontend and backend typechecks.
- Run frontend and backend builds.
- Run `pnpm db:validate`.
- Run Docker Compose configuration validation without starting services.
- Review GitHub Actions syntax and the two new named gates.
- Run `git diff --check`.
- Verify only approved files changed.

No database or seed verification is required because this foundation is
deliberately database-independent.

## Documentation Impact

- Update `docs/testing-strategy.md`.
- Update `docs/local-development.md`.
- Update `AGENTS.md`.
- Update `PROGRESS.md`.
- Update this task with implementation and verification results.

## API Contract Impact

None. The health test preserves the existing platform contract but creates no
product API contract.

## Seed Data Impact

None. Tests must not read, reset, or mutate catalog seed data.

## Test Impact

- Health tests: adds isolated and in-memory HTTP coverage for `GET /health`.
- Clean core behavior tests: establishes the runner and command boundary only.
- Bug verification tests: none.
- Contract tests: establishes the future API harness only.
- Performance smoke tests: none.

## Bug Registry Impact

None. Planned bug behavior remains unavailable and must not affect health.

## Dependencies

Backend dev dependencies:

- `@nestjs/testing` `11.1.28`.
- `jest` `29.7.0`.
- `ts-jest` `29.4.12`.
- `@types/jest` `29.5.14`.
- `supertest` `7.2.2`.
- `@types/supertest` `7.2.1`.

No runtime dependency, service, container, or new pnpm lifecycle-script
allowance is approved.

## Commit Decision

Commit separately after task completion. Approved by the human project owner on
2026-07-24.

## Implementation Notes

- Added only the six approved exact backend dev dependencies and updated the
  pnpm lockfile.
- Added separate Jest configuration and discovery patterns for backend unit and
  in-memory API tests.
- Added one health controller unit test and one Supertest HTTP health test.
- Added root and backend package commands for unit, watch, and API test modes.
- Added separate backend unit and API steps to the existing CI quality job.
- Updated governance, testing, local development, and progress documentation.
- Dependency installation used Node.js system CA support through
  `NODE_OPTIONS=--use-system-ca` because the local registry trust chain was not
  accepted by Node's bundled CA set. TLS verification was not disabled.
- No production behavior, database integration, seed data, product contract,
  catalog API, or planned bug behavior was changed.

## Verification Results

- Clean `pnpm install --frozen-lockfile`: passed; pnpm confirmed the lockfile
  was current and restored all packages from the local store.
- `pnpm test`: passed, 1 unit suite and 1 test.
- `pnpm test:api`: passed, 1 API suite and 1 test.
- Backend package `test` and `test:api` commands: passed directly.
- Unit discovery: only `src/health/health.controller.spec.ts`.
- API discovery: only `test/health.api-spec.ts`.
- `pnpm typecheck:web`: passed.
- `pnpm typecheck:api`: passed.
- `pnpm build:web`: passed.
- `pnpm build:api`: passed.
- `pnpm db:validate`: passed.
- `docker compose --env-file .env.example config --quiet`: passed without
  starting services. Docker emitted a non-blocking local warning because its
  user config file was not readable in the restricted execution environment.

## Risks and Open Questions

- Jest 29 is not the newest Jest major. It is recommended because it matches
  the current stable ts-jest major and avoids introducing a native SWC/Babel
  transform stack. A Jest 30 upgrade should be a separate tooling task once a
  compatible transformer strategy is approved.
- Separate Jest configs add a small amount of duplication but make unit versus
  API discovery and CI intent explicit.
- Running in-band is slower than parallel execution at scale, but the initial
  suite is tiny and deterministic cleanup matters more. Revisit when test
  duration becomes measurable.
- The API harness initially mirrors the current minimal bootstrap. If global
  pipes, filters, prefixes, or middleware are added later, their task must keep
  runtime and test bootstrap behavior aligned.
- Database-backed catalog API tests cannot be designed safely until Prisma
  Client ownership and test fixture isolation are approved.
