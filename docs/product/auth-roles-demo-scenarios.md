# Auth, Roles and Demo Scenarios Plan

## Purpose

This document defines the Phase 2 planning baseline for authentication, roles,
and deterministic demo accounts in QA Comics Gym.

It records the accepted auth direction and the implementation status of the
first Phase 2 slices. Future approved tasks still need to add frontend auth
behavior, browser auth coverage, and later protected product surfaces.

## Current Planning Status

Accepted for planning now:

- Phase 2 should introduce guest, user, and admin scenario foundations.
- Auth must be clean behavior first, with no planned bugs.
- Demo accounts are public local training fixtures, not real secrets.
- Seed data for accounts must be deterministic and resettable.
- Auth decisions must preserve RU/EN localized routes and production-style
  engineering boundaries for the local MVP.
- The internal auth API contract is planned in
  `docs/internal/api/auth.md`.

Still requiring implementation-task approval:

- Exact frontend route names and UI copy.
- Exact Playwright and API test cases.
- Any protected in-app bug guide route.

Implemented by task `0025`:

- Backend login, logout, and current-user API.
- Argon2id password verification through the npm package `argon2`.
- Database-backed opaque sessions with hashed server-side tokens.
- Local MVP `qcg_session` HTTP-only SameSite cookie.
- Process-local login throttling for the first MVP backend slice.

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
| User | `user@qacomics.local` | `DemoUserPassphrase2026!` | `USER` | Normal authenticated buyer scenario |
| Admin | `admin@qacomics.local` | `DemoAdminPassphrase2026!` | `ADMIN` | Admin-only access scenario |

These credentials are deliberately public demo fixtures. Documentation may list
them because they are not secrets and must not grant access to real systems.

Seed rules:

- Store password hashes, not plaintext passwords.
- Keep plaintext demo passwords only in docs and seed comments where needed for
  local usage.
- Seeded single-factor demo passwords must be at least `15` characters.
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
- Generate session tokens with a cryptographically secure random number
  generator and at least `128` bits of entropy.
- Store only a hashed session token server-side.
- Send the session identifier in an HTTP-only, SameSite cookie.
- Use short, clear expiration behavior suitable for local training.
- Add CSRF protection before authenticated state-changing browser APIs expand
  beyond login/logout.

Accepted internal contract direction from task `0023`:

- Local MVP cookie name: `qcg_session`.
- Future HTTPS deployment cookie name: `__Host-qcg_session`.
- SameSite mode: `Lax`.
- Recommended initial absolute timeout: `8` hours.
- Recommended initial idle timeout: `30` minutes.
- Local HTTP keeps `Secure=false`; future HTTPS deployment should use
  `Secure=true`.
- Logout is idempotent and clears the cookie even when the session is missing
  or invalid.
- Raw session tokens are never stored in the database or returned in JSON.

## Password Storage Direction

Task `0025` selected and implemented the npm package `argon2`.

Recommended direction:

- Use Argon2id through `argon2` for the clean MVP auth API.
- Use Argon2id with at least `19 MiB` memory, `2` iterations, and parallelism
  `1`, unless implementation benchmarking justifies stronger parameters.
- Use bcrypt as the fallback recommendation if Argon2 native installation adds
  too much local setup friction.
- If bcrypt is selected, use a work factor of at least `10` and account for the
  common `72` byte password input limit.
- Do not use plain SHA hashing.
- Do not store plaintext passwords in the database.
- Do not treat seeded demo passwords as secrets.

The selected parameters are at least `19 MiB` memory, `2` iterations, and
parallelism `1`, matching the internal contract target.

## Backend Surface Planning

Implemented backend API routes:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Implemented clean backend behavior:

- Login accepts email and password.
- Successful login creates a session and returns the current user DTO.
- Failed login returns the same stable error for unknown email and wrong
  password.
- Disabled or locked account states also return the same generic login failure
  response.
- Login attempts require a local-friendly throttling or delay strategy.
- Logout is idempotent for missing or expired sessions.
- `GET /me` returns the authenticated user when a valid session exists.
- `GET /me` returns a stable unauthenticated error when there is no valid
  session.

Task `0025` allows multiple active sessions for the same account. Session
management UI, device lists, and revoking all sessions are later scope.

Accepted internal API direction from task `0023`:

- Login success returns HTTP `200`, sets `qcg_session`, and returns
  `{ data: { user } }`.
- Logout success returns HTTP `204` with an empty body.
- Current-user success returns HTTP `200` with `{ data: { user } }`.
- Missing, expired, revoked, malformed, or unknown sessions return
  `UNAUTHENTICATED`.
- Unknown email, wrong password, disabled account, and locked account states
  return the same `INVALID_CREDENTIALS` response from login.
- Excessive login attempts return `AUTH_RATE_LIMITED` without bucket details.
- Protected-route role failures return `FORBIDDEN`; unauthenticated protected
  requests return `UNAUTHENTICATED`.

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

Implemented by task `0024`:

- `User`
- `Session`
- `UserRole`

Implemented `User` fields:

- Database-generated internal ID.
- Stable public ID for local references.
- Email, unique and normalized.
- Password hash.
- Display name.
- Role enum.
- Enabled/disabled status.
- Created and updated timestamps.

Implemented `Session` fields:

- Database-generated internal ID.
- User relationship.
- Hashed session token.
- Expiration timestamp.
- Last-seen timestamp for idle timeout enforcement later.
- Created timestamp.
- Optional revoked timestamp.

Schema rules to consider:

- Email must be normalized before storage and lookup.
- Password hash must be non-empty.
- Role must be constrained to accepted values.
- Expired or revoked sessions must not authenticate.
- Seed reset must not rely on unstable generated IDs.
- Session token hashes are unique.
- Session expiration must be after creation.
- Session last-seen timestamp cannot be after expiration.
- Session revoked timestamp must be absent or not before creation.

## Seed Scenario Planning

Phase 2 seed should add deterministic account fixtures without changing clean
catalog behavior.

Implemented minimum seed:

- One enabled user account.
- One enabled admin account.
- No preexisting sessions.

Accepted public fixture IDs:

| Scenario | Email | Password | Role | Public ID |
| --- | --- | --- | --- | --- |
| User | `user@qacomics.local` | `DemoUserPassphrase2026!` | `USER` | `usr_demo_user` |
| Admin | `admin@qacomics.local` | `DemoAdminPassphrase2026!` | `ADMIN` | `usr_demo_admin` |

Optional later seed:

- Disabled user for access-denied API exercises.
- User with existing order history after Phase 3 exists.
- Admin-specific fixture data after Phase 4 exists.

Recommendation:

- Keep exactly two enabled accounts until a later approved task requires more.
- Add disabled/edge-case accounts only when a specific clean feature or planned
  bug needs them.

## Testing Plan

Health tests:

- Existing `GET /health` stays public and unauthenticated.
- Auth implementation must not make platform health depend on seeded users.

Clean core behavior tests:

- Valid login succeeds for seeded user and admin accounts.
- Invalid login fails without revealing whether email, password, disabled
  status, or locked status caused the failure.
- Login throttling or delay behavior is covered by focused API tests.
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

1. `0024-auth-database-schema-and-demo-seed.md`
   - Add user/session schema, migration, and two deterministic demo accounts.
   - Include seed verification.

2. `0025-backend-clean-auth-api.md`
   - Implement login, logout, and current-user API using the approved contract.
   - Add unit and Supertest coverage.

3. `0026-frontend-auth-shell-and-login.md`
   - Add localized login route, auth state loading, logout, and role-aware shell.
   - Add frontend unit/component tests.

4. `0027-auth-playwright-smoke.md`
   - Add browser smoke for user/admin login and logout while preserving guest
     catalog behavior.

This split keeps schema, backend behavior, frontend behavior, and browser
coverage reviewable. It also gives one explicit checkpoint before dependency
selection.

## Decisions Recommended for Approval Later

- Use database-backed opaque sessions with HTTP-only SameSite cookies.
- Generate opaque session tokens with CSPRNG and at least `128` bits of entropy.
- Model guest as unauthenticated state, not as a database role.
- Start with one role per account: `USER` or `ADMIN`.
- Seed exactly two enabled demo accounts first.
- Keep profile editing, registration, password reset, admin area, checkout,
  orders, and closed bug guide access out of the first auth implementation.
