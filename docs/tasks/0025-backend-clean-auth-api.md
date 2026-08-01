# Task 0025: Backend Clean Auth API

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-31 to implement task
  `0025`.
- Approved scope notes: Implement backend clean auth API with the approved
  `argon2` dependency; no frontend auth UI, Playwright auth smoke, planned
  bugs, public Swagger/OpenAPI, or unrelated database scope.

The approved scope is locked for implementation.

## Behavior Type

Clean Feature

This task implements the clean backend authentication API over the existing
auth persistence foundation. It must not add frontend auth UI, admin workflows,
planned bugs, or closed guide behavior.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Tasks `0022` and `0023` defined the Phase 2 auth direction and internal auth
contract. Task `0024` added the `User`, `Session`, and `UserRole` persistence
foundation plus two deterministic enabled demo accounts:

- `user@qacomics.local` / `DemoUserPassphrase2026!` / `USER`
- `admin@qacomics.local` / `DemoAdminPassphrase2026!` / `ADMIN`

The next clean slice is the backend API implementation for login, logout, and
current-user state. This gives API testers a real auth surface before frontend
login UI exists.

## Unplanned Work Record

None.

## Scope

### Backend API

Implement the internal auth contract in `docs/internal/api/auth.md`:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Add backend auth modules, controllers, services, schemas, and tests following
the existing NestJS/Zod/error-envelope style.

### Password Verification

- Add the API dependency needed to verify Argon2id password hashes.
- Prefer the npm package `argon2`.
- Use `argon2.verify` or equivalent package API; do not implement password
  hashing manually.
- If the currently seeded PHC hashes are not accepted by the selected verifier,
  update only the stored demo password hashes so they verify against the same
  approved plaintext demo passwords.
- Keep Argon2id parameters compatible with the contract: at least `19 MiB`
  memory, `2` iterations, and parallelism `1`.
- Do not store plaintext passwords.

### Session Behavior

- Generate opaque session tokens with Node.js cryptographically secure random
  bytes and at least `128` bits of entropy.
- Store only a deterministic server-side hash of the session token.
- Use the local MVP cookie name `qcg_session`.
- Set cookie attributes:
  - `HttpOnly`
  - `SameSite=Lax`
  - `Path=/`
  - `Max-Age` aligned to the absolute timeout
  - `Secure=false` for the current local HTTP runtime
- Use an `8` hour absolute timeout and `30` minute idle timeout.
- Reject expired, idle-expired, revoked, malformed, unknown, or missing
  sessions as `UNAUTHENTICATED`.
- Update session last-seen state only when needed for clean session behavior.
- Logout is idempotent, clears the cookie, and does not reveal whether a cookie
  matched a real session.

### Login Behavior

- Accept JSON body with `email` and `password`.
- Normalize email before lookup.
- Reject unknown or repeated body fields with `INVALID_REQUEST`.
- Reject invalid email and password values with documented validation details.
- Return the same `INVALID_CREDENTIALS` response for unknown email, wrong
  password, disabled account, and locked account states.
- Do not reveal whether an account exists.
- Return the clean current-user DTO on success and do not expose password hash,
  session token, session hash, numeric database ID, or internal timestamps.

### Auth Throttling or Delay

Implement a minimal local-friendly login throttling or delay strategy:

- It must protect the login endpoint from unlimited rapid attempts in a single
  API process.
- It must not add Redis, queues, external services, or new database tables.
- It may use process-local memory for the first MVP implementation.
- It must return `AUTH_RATE_LIMITED` with HTTP `429` when the local threshold is
  exceeded.
- It must not reveal which account, source, or bucket triggered the limit.
- Exact threshold constants should be documented in code or docs.

### API Tests

Add or update backend tests for:

- Successful user login sets the cookie and returns the user DTO.
- Successful admin login returns the admin DTO.
- `GET /me` succeeds with a valid cookie.
- `GET /me` returns `UNAUTHENTICATED` for missing, malformed, unknown, expired,
  idle-expired, or revoked sessions.
- Logout returns `204`, clears the cookie, and is idempotent.
- Unknown email and wrong password return the same `INVALID_CREDENTIALS`
  envelope.
- Disabled/locked account privacy behavior if represented in the schema or test
  setup.
- Validation errors for invalid body fields and unknown body keys.
- Cookie attributes.
- Sensitive fields are absent from DTOs.
- Login throttling or delay behavior.
- Existing health and catalog API tests still pass.

### Documentation

- Update `docs/internal/api/auth.md` from planned contract target to
  implemented contract target.
- Update `docs/product/auth-roles-demo-scenarios.md` with implemented backend
  behavior.
- Update `docs/architecture.md` with backend auth module/session notes.
- Update `docs/testing-strategy.md` with implemented auth API coverage.
- Update `docs/local-runbook.md` with API-level login/logout checks if useful.
- Update `PROGRESS.md` after implementation and verification.

## Out of Scope

- Frontend login route, auth shell, route protection, or UI copy.
- Playwright auth smoke tests.
- Admin area implementation.
- Cart, checkout, order, profile, registration, password reset, email, MFA, or
  external identity provider behavior.
- Public Swagger/OpenAPI publication.
- Closed bug guide access.
- Planned bugs, bug flags, bug registry entries, or spoiler content.
- New database tables or migrations unless a scoped amendment is approved.
- Redis, queues, external rate-limit services, or production-grade distributed
  throttling.
- Changing catalog API behavior.

## Acceptance Criteria

- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and
  `GET /api/v1/auth/me` are implemented and match the internal contract.
- Demo user and admin accounts can authenticate with the documented passwords.
- Sessions are stored server-side as hashes, not raw tokens.
- Cookie behavior matches the local MVP contract.
- Unauthenticated, invalid credentials, forbidden, rate-limited, validation, and
  internal errors use stable JSON envelopes.
- Login does not leak account existence, disabled state, or locked state.
- Logout is idempotent.
- Current-user DTO exposes only the approved public fields.
- Relevant unit and database-backed API tests pass.
- Existing catalog and health tests continue to pass.
- Docs and progress are updated.
- No frontend UI, planned bug, closed guide, or unrelated refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run Prisma schema validation if seed hashes or Prisma usage changes.
- Apply committed migrations and deterministic seed to local PostgreSQL.
- Run `pnpm test:unit:api` or the equivalent local Jest unit command.
- Run `pnpm test:api` or the equivalent local DB-backed API command.
- Run API typecheck and build.
- Run frontend tests only if frontend files are changed; none are expected.
- Inspect generated files, secrets, package changes, and staged diff before any
  commit.

## Documentation Impact

- Update `docs/internal/api/auth.md`.
- Update `docs/product/auth-roles-demo-scenarios.md`.
- Update `docs/architecture.md`.
- Update `docs/testing-strategy.md`.
- Update `docs/local-runbook.md` if API check commands are added.
- Update `PROGRESS.md`.

## API Contract Impact

Yes. This task implements the internal auth API contract.

If implementation requires changing route names, status codes, DTO shapes,
cookie behavior, error codes, or validation messages, stop and propose a
contract amendment before implementing the change.

Public Swagger/OpenAPI remains unchanged.

## Seed Data Impact

Limited seed impact is allowed only for demo password hashes:

- The two demo account emails, passwords, roles, public IDs, display names, and
  enabled state must not change.
- If the selected Argon2id verifier rejects the current static hashes, replace
  only those stored hashes with verifier-valid Argon2id hashes using the same
  documented plaintext passwords.
- Do not add sessions or additional accounts.
- Do not change catalog seed records.

## Test Impact

- Health tests: Existing public health behavior must remain unaffected.
- Clean core behavior tests: Add backend auth service/API tests.
- Bug verification tests: None.
- Contract tests: Add auth API contract coverage for routes, DTOs, cookies, and
  errors.
- Performance smoke tests: None.

## Bug Registry Impact

None.

## Dependencies

Expected new API dependency:

- `argon2`

No frontend dependency is expected. No Redis, queue, external service, or new
database dependency is allowed in this task.

If `argon2` cannot be installed or verified reliably in this local Windows
setup, stop and propose an amendment before switching to bcrypt or another
package.

## Implementation Notes

- 2026-07-31: `argon2@0.45.1` selected after package metadata review. Public
  sources indicate the package is `node-argon2`, published on npm as `argon2`,
  MIT licensed, backed by `github.com/ranisalt/node-argon2`, and compatible with
  Node `>=22.0.0`.
- 2026-07-31: Local Node version is `v22.17.0`, which satisfies the package
  engine requirement.
- 2026-07-31: Local `pnpm add argon2@0.45.1` attempts did not update
  `apps/api/package.json` or `pnpm-lock.yaml`. The installs timed out while
  verifying/fetching registry data, and `npm view argon2@0.45.1 ...` also timed
  out. Implementation is paused until dependency installation can complete
  reproducibly through the package manager.
- 2026-08-01: Human project owner ran the package-manager install from a local
  console successfully. `argon2@0.45.1` was added to the API package and
  `pnpm approve-builds argon2` allowed only the `argon2` native build script.
- 2026-08-01: The originally committed static demo PHC hashes were not accepted
  by `argon2.verify`. Only the two demo account `password_hash` seed values
  were regenerated for the same approved plaintext demo passwords with
  Argon2id parameters `m=19456`, `t=2`, and `p=1`.
- 2026-08-01: Local Docker could not bind the default `.env` port `55432` on
  this Windows environment. Verification used a temporary runtime override on
  port `65432` without changing committed environment files.

## Implementation Summary

- Added `apps/api/src/auth/` with NestJS auth module, controller, service,
  request schemas, login throttling, and session cookie/token helpers.
- Implemented `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and
  `GET /api/v1/auth/me`.
- Added `argon2@0.45.1` as the API password verification dependency.
- Implemented Argon2id verification, database-backed opaque sessions, hashed
  server-side session tokens, local MVP `qcg_session` cookie serialization,
  idempotent logout, absolute and idle session timeout checks, and generic
  invalid credential behavior.
- Implemented process-local login throttling with `10` failed attempts per
  normalized email per `10` minutes and `100` failed attempts per source per
  `10` minutes.
- Added unit tests for auth schemas and session helpers.
- Added DB-backed Supertest coverage for login, logout, current-user state,
  invalid credential parity, unauthenticated session states, cookie attributes,
  sensitive DTO fields, throttling, and existing health/catalog behavior.
- Updated internal auth contract, product auth planning, architecture, testing
  strategy, local runbook, progress, seed hashes, and auth seed checks.

## Verification Results

- Passed: `node scripts/validate-task-governance.mjs`.
- Passed: `git diff --check`.
- Passed: `pnpm db:validate`.
- Passed: `pnpm --filter @qa-comics-gym/api typecheck`.
- Passed: `pnpm --filter @qa-comics-gym/api build`.
- Passed: `pnpm test:unit:api`.
- Passed with temporary local `DATABASE_URL` on port `65432`: `pnpm test:api`.

## Commit Decision

Commit separately as the task `0025` checkpoint after explicit human approval.

## Risks and Open Questions

- `argon2` is a native dependency and may add Windows install friction.
- The first login throttling implementation is process-local and not suitable
  for distributed production deployment; that is acceptable for the local MVP
  but must be documented.
- Session validation may need careful time control in tests to avoid flakiness.
- Cookie serialization should avoid adding a cookie parser dependency unless
  implementation proves it is necessary.
- Future frontend auth work must consume this API without changing the backend
  contract silently.
