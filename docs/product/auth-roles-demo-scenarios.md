# Auth, Roles and Demo Scenarios Plan

## Purpose

This document defines the Phase 2 planning baseline for authentication, roles,
and deterministic demo accounts in QA Comics Gym.

It is not an implementation contract yet. Future approved tasks must turn the
accepted parts into database schema, seed data, internal API contracts,
frontend behavior, and tests.

## Current Planning Status

Accepted for planning now:

- Phase 2 should introduce guest, user, and admin scenario foundations.
- Auth must be clean behavior first, with no planned bugs.
- Demo accounts are public local training fixtures, not real secrets.
- Seed data for accounts must be deterministic and resettable.
- Auth decisions must preserve RU/EN localized routes and production-style
  engineering boundaries for the local MVP.

Still requiring implementation-task approval:

- Exact database models and migration SQL.
- Exact auth dependency choices.
- Exact API request and response DTOs.
- Exact frontend route names and UI copy.
- Exact Playwright and API test cases.
- Any protected in-app bug guide route.

## MVP Goals

Phase 2 should make these scenarios possible:

- Guest: browse the clean catalog without logging in.
- User: log in with a seeded demo account, see authenticated state, log out,
  and later use checkout/order workflows.
- Admin: log in with a seeded admin account and later access admin-only
  surfaces.

The first auth slice should prove identity, session state, and role boundaries.
It should not pull cart, checkout, orders, admin management, or closed bug guide
behavior into the same implementation task.

## MVP Non-Goals

Phase 2 should not include:

- Registration or self-service account creation.
- Password reset.
- Real email.
- External identity providers.
- MFA.
- Account profile editing beyond what a future checkout task needs.
- Social login.
- User progress tracking.
- Production-scale security monitoring.
- Multi-tenant auth.
- Paid-user authorization.
- Closed bug guide access unless a later task explicitly includes it.

## Role Model

Recommended MVP role model:

- `USER`
- `ADMIN`

Guest is not a database role. Guest means "no authenticated session".

Recommendation: use one role per account at the start.

Why this is useful:

- It keeps Phase 2 small.
- It is enough for guest/user/admin QA scenarios.
- It avoids premature permission matrices before admin workflows exist.
- It can be expanded later to role arrays or permissions if real product needs
  appear.

Admin should be treated as a separate role with higher privileges, not as an
implicit flag hidden inside user data. Future admin-only API and UI behavior
should check role explicitly.

## Demo Accounts

Recommended demo accounts:

| Scenario | Email | Password | Role | Purpose |
| --- | --- | --- | --- | --- |
| User | `user@qacomics.local` | `DemoUser123!` | `USER` | Normal authenticated buyer scenario |
| Admin | `admin@qacomics.local` | `DemoAdmin123!` | `ADMIN` | Admin-only access scenario |

These credentials are deliberately public demo fixtures. Documentation may list
them because they are not secrets and must not grant access to real systems.

Seed rules:

- Store password hashes, not plaintext passwords.
- Keep plaintext demo passwords only in docs and seed comments where needed for
  local usage.
- Resetting seed data must restore the same demo accounts.
- Account IDs may be database-generated, but tests and docs should reference
  stable email addresses.
- Demo accounts should have stable display names in EN/RU-ready UI copy where
  visible.

## Session Strategy Options

Option 1: database-backed server session with an HTTP-only cookie.

Recommendation: choose this for the MVP.

Pluses:

- Browser behavior matches common production applications.
- Logout and session revocation are straightforward.
- Tokens are not exposed to frontend JavaScript.
- Playwright tests can exercise real browser session behavior.
- Future role checks can use server-side session lookup.

Tradeoffs:

- Requires a session table.
- Requires CSRF posture to be considered for future write APIs.
- Slightly more backend code than a stateless JWT.

Option 2: JWT stored in an HTTP-only cookie.

Pluses:

- Fewer database reads for session validation.
- Familiar for API-oriented testers.

Tradeoffs:

- Revocation and logout semantics become more complicated.
- Role changes may stay stale until token expiry unless extra checks are added.
- Still needs careful cookie and CSRF handling.

Option 3: bearer JWT stored by the frontend.

Pluses:

- Simple for pure API exercises.
- Easy to inspect in API tools.

Tradeoffs:

- Weaker browser security posture if stored in local storage.
- Less representative of a careful production-style frontend.
- Makes logout mostly client-side unless a denylist is added.

Recommended MVP decision to carry into implementation planning:

- Use a database-backed opaque session token.
- Store only a hashed session token server-side.
- Send the session identifier in an HTTP-only, SameSite cookie.
- Use short, clear expiration behavior suitable for local training.
- Add CSRF protection before authenticated state-changing browser APIs expand
  beyond login/logout.

## Password Storage Direction

Implementation tasks must choose and approve the hashing dependency explicitly.

Recommended direction:

- Prefer Argon2id if the dependency behaves reliably on the supported local
  Windows setup.
- Use bcrypt as the fallback recommendation if Argon2 native installation adds
  too much local setup friction.
- Do not use plain SHA hashing.
- Do not store plaintext passwords in the database.
- Do not treat seeded demo passwords as secrets.

The implementation task should document the selected algorithm, parameters,
and why those parameters are appropriate for local MVP training.

## Backend Surface Planning

Likely internal API routes:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Likely clean behavior:

- Login accepts email and password.
- Successful login creates a session and returns the current user DTO.
- Failed login returns the same stable error for unknown email and wrong
  password.
- Logout is idempotent for missing or expired sessions.
- `GET /me` returns the authenticated user when a valid session exists.
- `GET /me` returns a stable unauthenticated error or anonymous envelope. The
  exact shape belongs in the internal API contract task.

User DTO should expose:

- Stable public user identifier.
- Email.
- Display name.
- Role.

User DTO should not expose:

- Password hash.
- Session token.
- Internal database-only fields unless explicitly needed for QA training.

## Frontend Surface Planning

Likely localized routes:

- `/en/login`
- `/ru/login`

Likely app behavior:

- Guest catalog routes remain public.
- Header or app shell shows clear authenticated/guest state.
- Login form is localized and accessible.
- Logout is available for authenticated users.
- Admin navigation is visible only for admin users once admin surfaces exist.
- Protected routes redirect or display an access-denied state consistently.

Recommendation:

- Keep the first frontend auth task small: login, logout, current-user state,
  and role-aware shell only.
- Do not build profile editing in Phase 2.
- Do not build the admin area in the auth task.

## Database Planning

Likely models:

- `User`
- `Session`

Likely `User` fields:

- Database-generated internal ID.
- Stable public ID or stable email for local references.
- Email, unique and normalized.
- Password hash.
- Display name.
- Role enum.
- Enabled/disabled status.
- Created and updated timestamps.

Likely `Session` fields:

- Database-generated internal ID.
- User relationship.
- Hashed session token.
- Expiration timestamp.
- Created timestamp.
- Optional revoked timestamp.

Schema rules to consider:

- Email must be normalized before storage and lookup.
- Password hash must be non-empty.
- Role must be constrained to accepted values.
- Expired or revoked sessions must not authenticate.
- Seed reset must not rely on unstable generated IDs.

## Seed Scenario Planning

Phase 2 seed should add deterministic account fixtures without changing clean
catalog behavior.

Minimum useful seed:

- One enabled user account.
- One enabled admin account.
- No preexisting sessions.

Optional later seed:

- Disabled user for access-denied API exercises.
- User with existing order history after Phase 3 exists.
- Admin-specific fixture data after Phase 4 exists.

Recommendation:

- Start with exactly two enabled accounts.
- Add disabled/edge-case accounts only when a specific clean feature or planned
  bug needs them.

## Testing Plan

Health tests:

- Existing `GET /health` stays public and unauthenticated.
- Auth implementation must not make platform health depend on seeded users.

Clean core behavior tests:

- Valid login succeeds for seeded user and admin accounts.
- Invalid login fails without revealing whether email or password was wrong.
- Logout clears the session.
- Session expiration/revocation behavior is covered where implemented.
- Guest catalog browsing continues to work.

Contract tests:

- Login, logout, and current-user response shapes match the internal contract.
- Error envelopes match existing API conventions.
- Role errors are deterministic.

Playwright E2E:

- User can log in and log out through localized UI.
- Admin can log in and sees role-aware shell state.
- Guest catalog smoke still passes.
- Locale prefixes remain stable through login redirects.

Bug verification tests:

- None in Phase 2 clean auth tasks.

Performance smoke tests:

- Not required for the first auth slice.

## Documentation Plan

Future implementation tasks should update:

- `docs/internal/api/auth.md` with auth routes and DTOs.
- `docs/product/auth-roles-demo-scenarios.md` with accepted implementation
  details.
- `docs/local-runbook.md` with demo account login checks.
- `docs/testing-strategy.md` with auth test taxonomy details.
- `PROGRESS.md` with accepted decisions.

Public docs may mention demo credentials when the public docs area exists.
They must not expose planned bug spoilers or closed guide hints.

## Recommended Task Split

Recommended next tasks:

1. `0023-auth-internal-contract-and-architecture.md`
   - Decide exact session strategy, route contract, DTOs, error envelopes,
     cookie rules, and dependency list.
   - No implementation unless explicitly scoped.

2. `0024-auth-database-schema-and-demo-seed.md`
   - Add user/session schema, migration, and two deterministic demo accounts.
   - Include seed verification.

3. `0025-backend-clean-auth-api.md`
   - Implement login, logout, and current-user API using the approved contract.
   - Add unit and Supertest coverage.

4. `0026-frontend-auth-shell-and-login.md`
   - Add localized login route, auth state loading, logout, and role-aware shell.
   - Add frontend unit/component tests.

5. `0027-auth-playwright-smoke.md`
   - Add browser smoke for user/admin login and logout while preserving guest
     catalog behavior.

This split keeps schema, backend behavior, frontend behavior, and browser
coverage reviewable. It also gives one explicit checkpoint before dependency
selection.

## Decisions Recommended for Approval Later

- Use database-backed opaque sessions with HTTP-only SameSite cookies.
- Model guest as unauthenticated state, not as a database role.
- Start with one role per account: `USER` or `ADMIN`.
- Seed exactly two enabled demo accounts first.
- Keep profile editing, registration, password reset, admin area, checkout,
  orders, and closed bug guide access out of the first auth implementation.

