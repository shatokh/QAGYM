# Task 0027: Auth Playwright API and UI E2E Smoke

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-01 to implement task
  `0027`.
- Approved scope notes: Implement focused Playwright API and UI E2E auth smoke
  without duplicating Supertest/Vitest matrices; no backend, frontend product,
  database, seed, dependency, planned bug, or admin route changes.

Do not start implementation while the approval record remains pending.

## Behavior Type

Test Only

This task adds Playwright API and UI end-to-end coverage for already
implemented clean auth behavior. It must not change product behavior, backend
API behavior, schema, seed data, or planned bug behavior.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Tasks `0024`, `0025`, and `0026` implemented the clean auth persistence,
backend API, and frontend localized login shell. The next step is browser smoke
coverage for the full auth workflow through the real frontend, backend, and
local PostgreSQL runtime.

The current Playwright foundation already runs catalog smoke tests through the
real frontend, backend, migrated PostgreSQL database, and deterministic seed.
This task should extend that foundation with focused auth E2E scenarios without
duplicating the detailed Supertest API matrix or Vitest component tests.

## Unplanned Work Record

None.

## Scope

### Non-Duplication Rule

Playwright coverage must focus on real deployed-runtime behavior:

- API E2E checks use Playwright `request` against the running API server.
- UI E2E checks use Playwright `page` against the running frontend and real API.
- Do not repeat every validation branch, error-envelope permutation, DTO field
  assertion, schema edge case, or component state already covered by
  Supertest/Vitest.
- Prefer one or two high-signal checks per risk: session cookie behavior,
  browser-visible auth state, localized navigation, and invalid-login privacy.
- Keep detailed contract edge cases in Supertest and component interaction
  detail in Vitest.

### Playwright API E2E Smoke

Add a focused auth API smoke spec under `e2e/` using Playwright `request` that
verifies the real API server can:

- Return health through the running API.
- Log in the demo user and receive the `qcg_session` HTTP-only cookie.
- Use that cookie to call `GET /api/v1/auth/me`.
- Log out and make the same cookie unauthenticated.
- Return generic invalid credentials for one representative bad login.

Do not duplicate the full backend API test matrix for malformed sessions,
expired sessions, idle timeout, disabled account privacy, repeated body keys,
all validation messages, or throttling thresholds. Those stay in Supertest.

### Playwright UI E2E Smoke

Add a focused clean auth browser smoke suite under `e2e/` that verifies:

- Guest can open `/en/login`.
- User can log in with `user@qacomics.local` /
  `DemoUserPassphrase2026!`.
- Successful user login redirects to localized catalog and shows authenticated
  shell state.
- User can log out and returns to guest shell state.
- Admin can log in with `admin@qacomics.local` /
  `DemoAdminPassphrase2026!`.
- Admin shell state shows the admin role label without requiring admin routes.
- Invalid credentials show generic UI copy and do not reveal account existence.
- Russian login route `/ru/login` renders localized UI and preserves localized
  navigation after successful login.
- Guest catalog browsing still works without authentication.

Avoid duplicating Vitest coverage for all local form validation details,
component-level loading states, and auth client schema parsing. Those remain in
frontend unit/component tests.

### State Isolation

- Keep tests deterministic and serial enough for shared local demo accounts.
- Do not mutate account seed data.
- Do not add new demo accounts.
- Clear browser context/session state between scenarios using Playwright
  context isolation or equivalent.
- If the existing backend session table creates cross-test risk, use the
  existing deterministic seed preparation before the suite rather than adding
  ad hoc database cleanup inside tests.

### Locator Strategy

- Use semantic Playwright locators first: roles, labels, and accessible names.
- Use existing stable `data-testid` values only where semantic locators are
  insufficient.
- Do not add selectors that expose passwords, session tokens, planned bug IDs,
  or spoiler details.

### Documentation

- Update testing strategy with implemented auth Playwright smoke coverage.
- Update local runbook with the auth smoke command expectation if needed.
- Update progress after implementation and verification.

## Out of Scope

- Backend API changes.
- Frontend product behavior changes beyond testability fixes that are required
  and explicitly documented.
- Database schema, migrations, seed data, or demo account changes.
- Planned bugs, bug flags, bug registry entries, or closed guide behavior.
- Admin area implementation.
- Cart, checkout, order history, profile editing, registration, password
  reset, email, MFA, or external identity providers.
- Playwright browser matrix expansion beyond the existing project.
- Visual snapshots, axe dependency, or performance testing.
- CI workflow restructuring unless the existing `pnpm test:e2e` command already
  covers the added specs.

## Acceptance Criteria

- Auth Playwright API and UI E2E specs are added under `e2e/`.
- API E2E verifies one real login, `/me`, logout, and invalid-login path
  against the running backend.
- UI E2E verifies user login/logout through the real frontend and backend.
- UI E2E verifies admin login shows the admin shell role state.
- UI E2E verifies invalid login shows generic user-safe auth error copy.
- UI E2E covers the RU login route.
- Guest catalog smoke remains unaffected.
- Tests use stable semantic locators and approved test IDs.
- `pnpm test:e2e` includes the new auth smoke coverage.
- Existing frontend unit/component tests still pass.
- No backend API, schema, seed, planned bug, dependency, or unrelated refactor
  is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run `pnpm test:web`.
- Prepare PostgreSQL with committed migrations and deterministic seed.
- Run `pnpm test:e2e`.
- Run targeted Playwright auth API/UI specs if useful during iteration.
- Run frontend typecheck/build only if implementation touches frontend source
  files outside `e2e/`; none are expected.
- Inspect generated files, secrets, reports, and staged diff before any commit.

## Documentation Impact

- Update `docs/testing-strategy.md`.
- Update `docs/local-runbook.md` if command or scenario documentation changes.
- Update `PROGRESS.md`.

## API Contract Impact

None.

This task tests the existing auth API contract; it must not change route names,
DTO shapes, cookie behavior, status codes, or error codes.

## Seed Data Impact

None.

Use the existing deterministic demo accounts:

- `user@qacomics.local` / `DemoUserPassphrase2026!` / `USER`
- `admin@qacomics.local` / `DemoAdminPassphrase2026!` / `ADMIN`

## Test Impact

- Health tests: No direct change.
- Clean core behavior tests: Add Playwright API and UI E2E smoke for auth
  workflows.
- Bug verification tests: None.
- Contract tests: Runtime-level API smoke coverage of auth contract surfaces
  without duplicating the Supertest contract matrix.
- Performance smoke tests: None.

## Bug Registry Impact

None.

## Dependencies

None expected.

Use the existing Playwright setup and `@playwright/test` dependency. If auth
smoke implementation appears to need new tooling, stop and propose an
amendment before adding it.

## Commit Decision

Committed as `test(auth): add Playwright auth smoke` after explicit human
approval on 2026-08-03. Pushed to `origin/main`.

## Implementation Notes

- Added focused Playwright API auth smoke in `e2e/auth-api-smoke.spec.ts`.
- Added focused Playwright UI auth smoke in `e2e/auth-ui-smoke.spec.ts`.
- Updated `pnpm test:e2e` to use a repository-owned Node runner that starts or
  reuses the local API and Vite servers, waits for API readiness through the
  frontend proxy, and passes explicit spec arguments through to Playwright.
- Kept the suite on the existing Chromium project with semantic-first locators
  and existing stable test IDs.
- Did not change backend API behavior, frontend product behavior, database
  schema, seed data, dependencies, planned bugs, or admin routes.

## Verification Results

- Passed: `node --check scripts/run-playwright-e2e.mjs`.
- Passed: `node scripts/validate-task-governance.mjs`.
- Passed: `git diff --check`.
- Passed: `pnpm test:web`.
- Passed: short-timeout runner failure-path check returned exit code `1`
  instead of hanging when the local API/database was unavailable.
- Observed during runner debugging: the targeted auth Playwright API/UI specs
  reached `5 passed`, but the command was not accepted as final verification
  until the local runner exit behavior and database readiness were corrected.
- Passed by human local console: targeted auth Playwright E2E completed in
  about 11 seconds after Docker/PostgreSQL was restored.
- Not rerun through the Codex shell after the human result because Playwright
  commands were repeatedly interrupted by tool/pipe hangs in this environment,
  while the same command completed normally in the user's console.

## Risks and Open Questions

- The auth workflow creates sessions, so API/UI tests must avoid order
  dependency and shared session leakage.
- Running the full `pnpm test:e2e` requires PostgreSQL, API, and Vite runtime
  availability.
- Local Windows port configuration may differ from `.env.example`; the test
  command should rely on the existing local environment and Playwright config.
- Playwright should not use fixed sleeps; auth assertions must rely on
  navigation, role, label, and shell-state assertions.
