# Task 0024: Auth Database Schema and Demo Seed

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-31 to implement task
  `0024`.
- Approved scope notes: Implement auth persistence schema and deterministic
  demo account seed only; do not implement auth API routes, frontend auth,
  planned bugs, public Swagger/OpenAPI, or unapproved dependencies.

The approved scope is locked for implementation.

## Behavior Type

Clean Feature

This task adds the clean Phase 2 auth persistence foundation and deterministic
demo account fixtures. The schema migration and seed changes directly represent
the approved product model for authentication and roles.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Task `0022` defined Phase 2 auth, roles, and demo scenario planning. Task
`0023` created the internal auth API contract and architecture direction:
database-backed opaque sessions, guest as unauthenticated state, one role per
account, `USER` and `ADMIN` roles, public demo user IDs, and two enabled demo
accounts.

Before backend auth API behavior can be implemented, the database needs stable
auth models and the local seed must create deterministic demo accounts. This
task must keep the catalog seed behavior intact and must not introduce login
routes, guards, frontend UI, planned bugs, or auth dependencies beyond what is
explicitly approved here.

## Unplanned Work Record

None.

## Scope

### Prisma Schema and Migration

Add the auth persistence model to `prisma/schema.prisma` and a committed
migration:

- `User` model.
- `Session` model.
- `UserRole` enum with `USER` and `ADMIN`.

Planned `User` fields:

- Database-generated integer internal ID.
- Stable public ID, unique, using values like `usr_demo_user`.
- Email, unique, normalized lowercase.
- Password hash.
- Display name.
- Role.
- Enabled boolean.
- Creation and update timestamps.

Planned `Session` fields:

- Database-generated integer internal ID.
- User relationship.
- Hashed session token.
- Expiration timestamp.
- Last-seen timestamp for idle timeout enforcement later.
- Creation timestamp.
- Optional revoked timestamp.

Database constraints should enforce:

- Non-empty public ID, email, display name, password hash, and session hash.
- Lowercase normalized email.
- Stable public ID format.
- Session expiration after creation.
- Revoked timestamp is absent or not before creation.
- Useful indexes for session lookup, user email lookup, and user public ID
  lookup.

### Seed Data

Extend the deterministic seed to create exactly two enabled demo accounts:

| Scenario | Email | Password | Role | Public ID |
| --- | --- | --- | --- | --- |
| User | `user@qacomics.local` | `DemoUserPassphrase2026!` | `USER` | `usr_demo_user` |
| Admin | `admin@qacomics.local` | `DemoAdminPassphrase2026!` | `ADMIN` | `usr_demo_admin` |

Seed requirements:

- Store password hashes, not plaintext passwords.
- Use password hashes compatible with the approved `0023` Argon2id direction:
  at least `19 MiB` memory, `2` iterations, and parallelism `1`.
- Do not create preexisting sessions.
- Keep the catalog fixture unchanged except where the seed reset must include
  the new auth tables.
- Keep seed reset deterministic and safe for local demo data.
- Tests and docs must reference stable public IDs or emails, not generated
  numeric IDs.

### Verification and Tests

- Add or update database integrity checks for the auth schema.
- Add seed verification that confirms the two enabled accounts exist, roles are
  correct, password hashes are non-empty and not equal to plaintext passwords,
  and no sessions exist after seed.
- Keep this task free of login/password verification behavior tests; those
  belong to the backend auth API task.

### Documentation

- Update `docs/product/auth-roles-demo-scenarios.md` with implemented schema and
  seed decisions.
- Update `docs/architecture.md` with implemented auth persistence notes.
- Update `docs/local-development.md` or `docs/local-runbook.md` only if the
  seed/reset command behavior changes.
- Update `PROGRESS.md` after implementation and verification.

## Out of Scope

- Implementing `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, or
  `GET /api/v1/auth/me`.
- Adding NestJS guards, decorators, middleware, interceptors, cookie parsing,
  session validation, or role checks.
- Implementing frontend login routes, auth state, protected routes, or shell
  changes.
- Adding Playwright auth smoke tests.
- Adding public Swagger/OpenAPI.
- Adding registration, password reset, profile editing, cart, checkout, orders,
  admin area, or closed bug guide access.
- Creating disabled accounts or locked-account fixtures.
- Creating planned bugs, bug flags, bug registry entries, or closed guide
  spoilers.
- Changing existing catalog API/UI behavior.
- Adding a UI kit or frontend dependency.

## Acceptance Criteria

- Prisma schema contains `User`, `Session`, and `UserRole` with documented
  clean constraints.
- A committed migration applies cleanly to PostgreSQL.
- The deterministic seed creates exactly the two approved demo accounts and no
  sessions.
- Demo account emails, roles, public IDs, and enabled state match the contract.
- Password hashes are stored, plaintext passwords are not stored in the
  database, and hashes are compatible with the documented Argon2id direction.
- Existing clean catalog seed behavior still works.
- Existing catalog API and UI behavior are unchanged.
- Relevant schema/seed verification passes.
- Docs and progress are consistent with implementation.
- No auth API, frontend auth UI, planned bug, or unrelated refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run Prisma schema validation.
- Apply committed migrations to local PostgreSQL.
- Run deterministic seed.
- Verify Prisma migration status.
- Run database-backed seed/integrity checks.
- Run existing backend unit tests.
- Run existing database-backed API tests to confirm catalog behavior remains
  intact.
- Run frontend tests only if frontend files are changed; none are expected.
- Inspect `git status --short` for generated files before commit.

## Documentation Impact

- Update `docs/product/auth-roles-demo-scenarios.md`.
- Update `docs/architecture.md`.
- Update `PROGRESS.md`.
- Update local development/runbook docs only if command behavior changes.

## API Contract Impact

None expected. `docs/internal/api/auth.md` remains the planned contract target
from task `0023`; this task adds persistence and seed support only.

If implementation reveals a contract issue, stop and propose an amendment
instead of silently changing the contract.

## Seed Data Impact

Yes. Extend the deterministic seed with the two approved demo accounts and add
auth tables to the reset behavior. Do not change catalog fixture records unless
an approved amendment is needed.

## Test Impact

- Health tests: Existing health behavior must remain unaffected.
- Clean core behavior tests: Add seed/integrity checks for auth persistence.
- Bug verification tests: None.
- Contract tests: Existing catalog contract tests must keep passing; auth API
  contract tests remain future backend task scope.
- Performance smoke tests: None.

## Bug Registry Impact

None.

## Dependencies

No new runtime dependency is expected for the schema and seed work if committed
Argon2id-compatible password hashes are used.

If implementation requires a password hashing dependency or utility to generate
or verify hashes inside the repository, stop and propose an amendment naming
the dependency and why it belongs in this task rather than task `0025`.

## Commit Decision

Group with task 0023 after explicit human approval on 2026-07-31.

## Risks and Open Questions

- Argon2id hash generation must be reproducible enough for seed review without
  adding hidden dependencies.
- Native password-hashing dependencies may create Windows setup friction, so
  dependency selection should normally remain in the backend auth API task.
- Seed reset must include auth tables without damaging unrelated future data.
- The auth schema should support future login throttling, session expiration,
  and role checks without implementing those behaviors in this task.
- Exact session-token hashing implementation remains future backend API scope.

## Implementation Notes

- Added `UserRole`, `User`, and `Session` to `prisma/schema.prisma`.
- Added migration `20260731152000_auth_foundation`.
- Extended the deterministic seed to reset `sessions` and `users`, create the
  two approved enabled demo accounts, and create no sessions.
- Stored PHC-format Argon2id password hashes with the approved parameter set
  and no plaintext passwords in the database.
- Added DB-backed auth seed verification in
  `apps/api/test/auth-seed.api-spec.ts`.
- Existing catalog seed records and catalog API behavior remain unchanged.
- No auth API routes, frontend auth UI, planned bugs, or dependencies were
  added.

## Verification Results

- Governance validation passed.
- Prisma Client generation passed; generated output remains ignored.
- Prisma schema validation passed.
- API TypeScript check passed.
- API build passed.
- API unit suite passed: `3` suites, `8` tests.
- Applied `2` committed migrations to local PostgreSQL on temporary port
  `55547`; database schema is up to date.
- Deterministic seed passed, including embedded auth and catalog integrity
  checks.
- Database-backed API suite passed: `3` suites, `17` tests.
- `git diff --check` passed.
