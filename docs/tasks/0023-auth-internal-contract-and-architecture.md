# Task 0023: Auth Internal Contract and Architecture

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-31 to proceed with
  task `0023`.
- Approved scope notes: Create the internal auth API contract and supporting
  architecture/product/testing documentation only; do not implement code,
  schema, seed, dependencies, tests, public Swagger/OpenAPI, planned bugs, or
  closed guide behavior.
- Amendment notes: On 2026-07-31, the human owner approved best-practice
  updates for session entropy, cookie prefix direction, idle timeout, disabled
  login privacy, longer demo passwords, auth throttling, and password hashing
  parameter guidance.

The approved scope is locked for implementation.

## Behavior Type

Docs Only

This task turns the accepted Phase 2 auth planning direction into an internal
developer API contract and architecture notes. It does not implement auth
behavior.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Task `0022` established the Phase 2 planning baseline for authentication,
roles, and demo scenarios. The accepted direction is to keep guest as
unauthenticated state, start with `USER` and `ADMIN` roles, seed two enabled
demo accounts later, and prefer database-backed opaque sessions with
HTTP-only SameSite cookies.

Before schema, seed, backend API, frontend auth UI, or Playwright auth tests are
implemented, the project needs an internal auth contract and architecture
decision record. This keeps future implementation tasks small and prevents
auth behavior from drifting across backend, frontend, seed data, and tests.

## Unplanned Work Record

None.

## Scope

Create and update documentation only:

- Add `docs/internal/api/auth.md` defining the planned internal auth API
  contract for:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- Define planned request and response shapes at the documentation level.
- Define planned user DTO fields and fields that must never be exposed.
- Define planned auth error envelope behavior, including invalid credentials,
  unauthenticated access, disabled account, and forbidden role access.
- Define generic login failure behavior for disabled and locked accounts.
- Define login throttling or delay expectations.
- Define planned session cookie behavior:
  - HTTP-only.
  - SameSite.
  - secure flag expectations for local versus future deployment.
  - expiration.
  - logout behavior.
- Define session-token entropy and hashing expectations.
- Define planned CSRF posture for current and future authenticated write APIs.
- Define role and access-control semantics for guest, user, and admin.
- Define contract expectations for localization-independent API behavior.
- Update `docs/architecture.md` with auth/session architecture notes.
- Update `docs/product/auth-roles-demo-scenarios.md` with accepted contract
  decisions and any clarified boundaries.
- Update `docs/testing-strategy.md` with auth contract and role-boundary test
  expectations.
- Update `PROGRESS.md` with task status and accepted decisions.

The task may recommend a password hashing dependency for later implementation,
but must not add, install, or lock a dependency.

Recommended decisions to evaluate in this task:

- Use database-backed opaque session tokens.
- Store only hashed session tokens in the database.
- Use an HTTP-only SameSite cookie for browser sessions.
- Use a future HTTPS `__Host-` prefixed cookie direction.
- Use `GET /api/v1/auth/me` as the stable current-user endpoint.
- Make logout idempotent.
- Return the same invalid-credentials error for unknown email, wrong password,
  disabled account, and locked account states at login.
- Require login throttling or delay before backend auth is considered complete.
- Keep role checks explicit and deterministic.

## Out of Scope

- Installing auth, hashing, cookie, CSRF, or validation dependencies.
- Creating or modifying Prisma schema, migrations, generated client output, or
  seed SQL.
- Implementing login, logout, current-user, session validation, guards,
  decorators, middleware, interceptors, or frontend auth flows.
- Adding demo accounts to seed data.
- Creating Playwright, Jest, Supertest, or Vitest auth tests.
- Creating public Swagger/OpenAPI.
- Implementing registration, password reset, profile editing, cart, checkout,
  orders, admin area, or closed bug guide access.
- Introducing planned bugs, bug flags, bug registry entries, or spoiler content.
- Changing existing catalog API or UI behavior.

## Acceptance Criteria

- `docs/internal/api/auth.md` exists and clearly defines the planned internal
  auth API surface.
- The contract uses stable route names, DTO field names, status codes, and
  error codes suitable for future implementation.
- Session and cookie rules are explicit enough for backend and Playwright tasks.
- Session entropy, timeout, and cookie prefix direction are explicit.
- Login error behavior does not expose account existence, disabled state, or
  locked state.
- Demo passwords are at least `15` characters.
- Password hashing guidance records Argon2id minimum parameters and bcrypt
  fallback constraints.
- Login throttling or delay expectations are documented without over-defining
  exact implementation thresholds.
- Role semantics clearly distinguish guest, user, admin, unauthenticated, and
  forbidden states.
- The contract does not leak passwords, password hashes, session tokens, or
  closed bug guide details.
- `docs/architecture.md`, `docs/product/auth-roles-demo-scenarios.md`, and
  `docs/testing-strategy.md` are consistent with the new contract.
- The task records which decisions are accepted and which remain deferred.
- No code, schema, seed, dependency, test, or generated files are changed.
- Governance validation passes.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Inspect `git status --short` to confirm only documentation and progress files
  changed.

No application tests are required because this is a docs-only contract and
architecture task.

## Documentation Impact

- Add `docs/internal/api/auth.md`.
- Update `docs/architecture.md`.
- Update `docs/product/auth-roles-demo-scenarios.md`.
- Update `docs/testing-strategy.md`.
- Update `PROGRESS.md`.

## API Contract Impact

Yes. This task creates the internal developer auth API contract only.

Public Swagger/OpenAPI remains unchanged and should be handled in a later public
documentation phase or explicitly approved Swagger task.

## Seed Data Impact

None. This task may define expected future seed account identities, but it must
not modify seed files.

## Test Impact

- Health tests: Document that platform health remains public.
- Clean core behavior tests: Define expected future auth behavior coverage.
- Bug verification tests: None.
- Contract tests: Define expected future auth contract coverage.
- Performance smoke tests: None.

No tests are created in this task.

## Bug Registry Impact

None.

## Dependencies

None.

Future implementation tasks must explicitly approve any dependency used for
password hashing, cookie parsing, CSRF handling, or auth utilities.

## Commit Decision

Group with task 0024 after explicit human request to proceed from contract
planning into implementation planning on 2026-07-31.

## Risks and Open Questions

- The exact password hashing dependency remains pending until implementation,
  though Argon2id parameter guidance and bcrypt fallback constraints are now
  documented.
- The exact login throttling or delay thresholds remain pending until backend
  implementation.
- The local cookie name and timeout values are documented contract targets;
  production deployment may need an approved migration to `__Host-qcg_session`.
- CSRF can be documented before there are many authenticated write APIs, but it
  should not add speculative implementation work to the first backend auth task.
- The internal contract should avoid over-designing account management that is
  out of MVP scope.
- Future public Swagger docs must not expose closed bug guide details.

## Implementation Notes

- Added `docs/internal/api/auth.md` as the planned internal developer auth API
  contract.
- Documented `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and
  `GET /api/v1/auth/me`.
- Accepted `qcg_session` as the planned HTTP-only SameSite cookie name and
  documented local versus future HTTPS `Secure` behavior.
- Documented future HTTPS direction for `__Host-qcg_session`.
- Accepted `8` hours absolute timeout and `30` minutes idle timeout as the
  recommended initial session lifetime.
- Documented CSPRNG session token generation with at least `128` bits of
  entropy.
- Defined `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, `UNAUTHENTICATED`,
  `FORBIDDEN`, and `AUTH_RATE_LIMITED` error behavior.
- Clarified that login returns `INVALID_CREDENTIALS` for unknown email, wrong
  password, disabled account, and locked account states.
- Updated demo passwords to `DemoUserPassphrase2026!` and
  `DemoAdminPassphrase2026!`.
- Documented Argon2id minimum parameters, bcrypt fallback constraints, and
  login throttling or delay expectations.
- Clarified that auth API shapes are locale-independent while frontend login
  routes remain localized.
- Updated architecture, product, testing strategy, and progress docs to align
  with the planned contract.

## Verification Results

- Governance validation passed: `23` tasks and `2` proposals.
- `git diff --check` passed.
- `git status --short` shows only documentation and progress files changed.
- Best-practice amendment scan confirmed that old demo passwords were removed
  and that the docs now include session entropy, idle timeout, future
  `__Host-` cookie direction, generic disabled-account login behavior,
  auth-rate-limit behavior, and password hashing guidance.
- No application tests were run because this is a docs-only contract and
  architecture task with no code, schema, seed, dependency, generated, or test
  changes.
