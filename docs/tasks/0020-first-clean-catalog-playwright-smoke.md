# Task 0020: First Clean Catalog Playwright Smoke

## Status

In Review

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-25 to implement task
  `0020` with the compact API and UI E2E coverage recommendations.
- Approved scope notes: Keep Supertest as the API integration/E2E layer; add
  missing clean API boundary cases. Add Playwright UI smoke, one 390 px
  viewport check, deterministic API failure handling, and request assertions.
  Do not add a second external-process API runner, visual snapshots, axe, or a
  browser matrix.

The approved scope is locked for implementation.

## Behavior Type

Test Only

This task adds the first browser-level clean-core coverage. Playwright setup,
its test command, and browser smoke tests are supporting test infrastructure;
the primary intent is verification of the already implemented catalog behavior.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Task `0017` completed the clean catalog list and detail UI and established the
stable automation surface. The repository currently has frontend component
tests but no browser runner. A small read-only Playwright smoke suite is the
next step so the clean product can be checked through the real frontend,
backend, PostgreSQL database, migrations, and deterministic seed.

This task follows the accepted decision in tasks `0016` and `0017`: introduce
Playwright immediately after the first real catalog UI, while keeping broader
browser coverage for Phase 8.

## Scope

- Add the approved `@playwright/test` dependency and lockfile changes.
- Add a repository-owned Playwright configuration with:
  - a stable local `baseURL`;
  - managed frontend and backend web servers or an explicitly documented
    existing-runtime mode;
  - `forbidOnly` in CI;
  - trace collection on the first retry;
  - failure screenshots and videos according to the repository artifact policy;
  - a deterministic browser project for the initial smoke suite.
- Add the root `pnpm test:e2e` command for the Playwright suite.
- Add read-only clean catalog smoke tests for:
  - English catalog load and accessible heading;
  - Russian catalog load with localized route and document language;
  - page two navigation and previous-page navigation;
  - card navigation to a stable-slug detail page;
  - detail content and localized back navigation;
  - invalid `page` canonicalization without an invalid API page request;
  - clean loading and visible failure handling where the runtime can support
    deterministic setup without replacing the happy-path API with mocks.
- Prefer semantic locators and accessible names. Use only the stable catalog
  `data-testid` contracts approved by task `0017` where semantic identity is
  insufficient.
- Keep tests read-only and use the existing deterministic clean seed. Planned
  bug flags must remain disabled.
- Extend the existing database-backed Supertest catalog suite with the small
  missing clean API boundary checks: draft/archived/unknown not-found parity,
  repeated and invalid query values, strict error envelope/content type, and
  absence of internal database fields. Do not create a second external-process
  API runner.
- Add one Playwright viewport check at 390 px that verifies the catalog remains
  usable without horizontal overflow. This is a viewport check, not a visual
  snapshot or device/browser matrix.
- Add one deterministic Playwright API-failure test using request routing only
  for the resilience case; the clean happy path must use the real API.
- Assert one representative browser request contains the expected locale,
  `page`, and frontend `pageSize=6` query values.

## Out of Scope

- Authenticated, admin, cart, checkout, order, or other write-flow tests.
- Planned bug verification or any bug flag changes.
- API contract, Swagger/OpenAPI, DTO, seed, Prisma, or product behavior changes.
- Full visual regression testing, accessibility auditing, or performance/load
  testing beyond basic browser smoke assertions.
- Cross-browser matrix expansion, mobile device projects, retries tuned for
  CI flakiness, and Phase 8 scenario coverage.
- Full accessibility audit tooling such as axe and visual snapshot baselines.
- Network mocking for the clean happy path. Focused mocked resilience tests are
  allowed only if real-runtime setup cannot make the failure deterministic and
  the test is clearly marked as a separate resilience case.
- Docker Compose changes, deployment changes, or a new test database service.
- A GitHub Actions job dedicated to E2E. The configuration must be CI-ready,
  but adding a CI execution gate is a later quality-gate decision.

## Acceptance Criteria

- `pnpm test:e2e` runs the initial Playwright suite against the real local
  application without a manual browser launch.
- The suite verifies EN and RU catalog routes, document language, page two,
  detail navigation, detail content, and back navigation.
- The suite verifies a 390 px viewport without horizontal overflow and covers
  one deterministic catalog API failure state.
- Invalid page input is canonicalized to page one and does not produce an API
  request with an invalid page value.
- The browser request contract exposes the expected locale, page, and page size
  values for the frontend catalog query.
- The existing Supertest suite covers clean API not-found parity, invalid and
  repeated query values, strict errors, and DTO field boundaries.
- Tests use the clean seed and do not mutate database state.
- The suite remains valid with planned bugs disabled and does not assert any
  planned bug behavior.
- Failure artifacts and retry traces are generated according to the configured
  Playwright policy.
- Existing frontend, backend, and root test commands continue to pass.
- No unrelated application behavior, API contract, seed, or documentation is
  changed.

## Verification Plan

- Prepare PostgreSQL with the committed migration and deterministic clean seed.
- Run `pnpm typecheck:web` and `pnpm test:web`.
- Run `pnpm test:unit:api` and the applicable database-backed API preparation
  and test command.
- Run `pnpm test:e2e` locally with the real frontend and backend.
- Run the suite with CI settings that enable `forbidOnly`.
- Confirm retry trace and failure artifact configuration without committing
  generated artifacts.
- Run `pnpm build:web` and root `pnpm test`.
- Run `node scripts/validate-task-governance.mjs` and `git diff --check`.
- Inspect `git status --short` for browser binaries, reports, secrets, and
  unrelated changes.

## Documentation Impact

- Update `docs/testing-strategy.md` with the implemented command and initial
  browser coverage.
- Update `docs/local-development.md` with the actual approved E2E command and
  required local runtime preparation.
- Add `docs/local-runbook.md` with the sequential Windows PowerShell startup,
  verification, test, and shutdown commands.
- Update `AGENTS.md` so `pnpm test:e2e` is documented as available rather than
  remaining a placeholder.
- Update `PROGRESS.md` after verification.
- Keep public documentation and the closed bug guide free of planned-bug
  spoilers.

## API Contract Impact

None. The suite consumes the existing internal catalog contract and must not
change public or internal API behavior.

## Seed Data Impact

None. Use the existing deterministic clean catalog seed and its stable slugs.

## Test Impact

- Health tests: Use existing runtime health preparation where needed.
- Clean core behavior tests: Add browser smoke coverage for catalog list/detail
  and the missing clean API boundary cases through Supertest.
- Bug verification tests: None.
- Contract tests: None; existing API contract tests remain authoritative.
- Performance smoke tests: None; k6 remains separate.

## Bug Registry Impact

None.

## Verification Results

- `node node_modules/@playwright/test/cli.js test --list` passed: 7 tests in 1
  Chromium project were discovered.
- Frontend TypeScript check passed through the local `tsc` binary.
- Frontend Vitest passed: 8 files and 33 tests.
- API unit Jest passed: 3 suites and 7 tests.
- Frontend production build passed through the local Vite binary.
- API test compilation completed, and the health API test passed.
- Database-backed catalog API tests and full Playwright runtime tests are
  blocked in this environment because the Docker daemon is unavailable and no
  migrated PostgreSQL service is running. The test command reports the missing
  database as a runtime prerequisite; no application workaround was added.
- Playwright test discovery passed: 7 tests in 1 Chromium project.
- Governance validation and `git diff --check` passed after the implementation
  and documentation updates.

The implementation is ready for human review once the local PostgreSQL runtime
is available for the remaining database-backed and browser verification.

## Dependencies

- `@playwright/test` as a reviewed development dependency.
- Playwright browser binaries installed through the documented setup or CI
  cache; binaries must not be committed.
- Existing Node, pnpm, Docker Compose, PostgreSQL, frontend, backend, Prisma,
  migration, and seed tooling.

## Commit Decision

Group with task 0017.

## Risks and Open Questions

- Managed web-server startup must not create port collisions with an already
  running local runtime.
- The first task should choose one deterministic browser project; the exact
  browser matrix remains a later decision.
- Failure artifact retention must avoid committing generated reports or
  screenshots.
- Database preparation and reset must remain explicit before introducing future
  authenticated or write-flow tests.
- The exact CI E2E gate and browser cache policy remain outside this task.
