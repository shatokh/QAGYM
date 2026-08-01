# Task 0026: Frontend Auth Shell and Localized Login

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-01 to implement task
  `0026`.
- Approved scope notes: Implement frontend auth shell and localized login
  using the existing backend auth API; no backend, database, seed, dependency,
  Playwright auth smoke, planned bug, or admin route scope.

Do not start implementation while the approval record remains pending.

## Behavior Type

Clean Feature

This task adds clean frontend authentication behavior on top of the implemented
backend auth API. It must not add planned bugs, admin workflows, cart,
checkout, order behavior, or Playwright auth smoke coverage.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Tasks `0022` through `0025` established the Phase 2 auth direction, internal
contract, persistence foundation, seeded demo accounts, and backend clean auth
API.

The next clean slice is the frontend auth shell and localized login workflow:

- Guest users can browse the catalog.
- Users and admins can log in through localized routes.
- The app shell can show authenticated or guest state.
- Users can log out.
- Frontend auth state consumes the backend `GET /api/v1/auth/me` contract.

The backend routes already implemented by task `0025` are:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Unplanned Work Record

None.

## Scope

### Frontend Routes

- Add localized login routes:
  - `/en/login`
  - `/ru/login`
- Keep `/en/comics` and `/ru/comics` public for guest users.
- Preserve unsupported-locale not-found behavior.
- Preserve locale switching behavior on auth pages.
- Use localized URLs and localized UI copy.

### Auth API Client

- Add frontend-owned auth API contract schemas with Zod.
- Add auth API client functions for:
  - login
  - logout
  - current user
- Use same-origin `/api/v1/auth/...` requests.
- Use browser cookie session behavior through `credentials: "same-origin"`.
- Validate successful response DTOs and error envelopes.
- Do not expose or store password hashes, session tokens, session hashes, or
  numeric database IDs in frontend state.

### Auth State

- Add an auth query/state boundary that loads current user state.
- Treat `UNAUTHENTICATED` from `/me` as clean guest state, not as a fatal route
  error.
- Keep unexpected auth API/network/contract failures observable as a user-safe
  auth state error.
- After successful login, update current-user state without reloading the page.
- After logout, clear current-user state without reloading the page.
- Avoid localStorage/sessionStorage token storage. The session lives in the
  backend HTTP-only cookie.

### Login UI

- Add localized, accessible login form UI.
- Include email and password fields with proper labels and autocomplete
  attributes.
- Use the public demo credentials from the docs as allowed local fixture
  behavior, but do not put credentials into test IDs or hidden metadata.
- Show validation errors for empty/invalid email and empty password.
- Show generic invalid credentials UI for backend `INVALID_CREDENTIALS`.
- Show generic throttling UI for backend `AUTH_RATE_LIMITED`.
- Show a user-safe unexpected auth error state for other failures.
- Disable duplicate submission while login is pending.
- On successful login, navigate to the localized catalog route by default.

### App Shell

- Update `AppLayout` or a contained shell component to show:
  - guest state with login link;
  - authenticated state with display name, role, and logout action.
- Use accessible navigation and button semantics.
- Keep role-aware shell behavior minimal:
  - show user/admin role label;
  - do not implement admin area links until admin routes exist.
- Preserve catalog navigation and locale switcher behavior.

### Tests

- Add frontend unit/component tests for:
  - auth API client contract parsing and same-origin request construction;
  - current-user guest handling for `UNAUTHENTICATED`;
  - login form validation;
  - successful user login;
  - successful admin login where relevant to shell role state;
  - invalid credentials and rate-limited UI;
  - logout state transition;
  - localized `/en/login` and `/ru/login` routes;
  - guest catalog remains public;
  - semantic locators and stable test IDs only where needed.
- Update existing frontend tests if app shell markup changes.

### Documentation

- Update product auth planning docs with the implemented frontend slice.
- Update testing strategy with frontend auth unit/component coverage.
- Update local runbook with browser login route checks if useful.
- Update progress after implementation and verification.

## Out of Scope

- Backend auth API changes.
- Database schema, migrations, seed data, or demo account changes.
- Planned bugs, bug flags, bug registry entries, or closed guide behavior.
- Playwright auth smoke tests.
- Admin area routes or admin-only page implementation.
- Cart, checkout, order history, profile editing, registration, password
  reset, email, MFA, or external identity providers.
- CSRF token strategy for future authenticated product writes beyond
  login/logout.
- Public Swagger/OpenAPI publication.
- New frontend dependencies unless an amendment explicitly approves them.
- Storing auth tokens in localStorage, sessionStorage, or frontend-readable
  cookies.
- Real production session management UI such as device list or revoke all
  sessions.

## Acceptance Criteria

- `/en/login` and `/ru/login` render localized accessible login forms.
- Guest users can still browse the catalog without authentication.
- Demo user and admin accounts can log in through the frontend against the
  backend auth API.
- Successful login updates the app shell and current-user state without a full
  page reload.
- Logout clears authenticated shell state and returns the user to a clean guest
  state.
- Auth state is backed by the HTTP-only cookie session; no frontend token
  storage is introduced.
- Invalid credentials, auth throttling, and unexpected auth errors are shown as
  user-safe UI states.
- Role-aware shell state distinguishes `USER` and `ADMIN` without adding admin
  routes.
- EN/RU route and document-language behavior remains consistent.
- Relevant frontend tests pass.
- Existing catalog frontend tests continue to pass.
- No backend API, database, seed, planned bug, or unrelated refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run `pnpm typecheck:web`.
- Run `pnpm test:web`.
- Run `pnpm build:web`.
- Run backend tests only if backend files are changed; none are expected.
- Run Playwright only if frontend route changes need a quick smoke check and
  the local runtime is already prepared; the full auth Playwright task remains
  separate.
- Inspect generated files, secrets, package changes, and staged diff before
  any commit.

## Documentation Impact

- Update `docs/product/auth-roles-demo-scenarios.md`.
- Update `docs/testing-strategy.md`.
- Update `docs/local-runbook.md` if browser login checks are added.
- Update `PROGRESS.md`.

## API Contract Impact

No backend contract change is expected.

This task consumes `docs/internal/api/auth.md`. If the frontend implementation
requires changing route names, status handling, DTO shapes, cookie behavior, or
error codes, stop and propose a contract amendment before implementation.

Public Swagger/OpenAPI remains unchanged.

## Seed Data Impact

None.

The existing demo accounts from task `0024` and verified by task `0025` are
used:

- `user@qacomics.local` / `DemoUserPassphrase2026!` / `USER`
- `admin@qacomics.local` / `DemoAdminPassphrase2026!` / `ADMIN`

## Test Impact

- Health tests: No direct change.
- Clean core behavior tests: Add frontend auth form, shell, and state tests.
- Bug verification tests: None.
- Contract tests: Add frontend auth client contract coverage against the
  internal auth DTO shape.
- Performance smoke tests: None.

## Bug Registry Impact

None.

## Dependencies

None expected.

Use the existing React, React Router, TanStack Query, i18next,
react-i18next, Zod, Vitest, Testing Library, and user-event setup.

If implementation appears to require React Hook Form or another form/state
dependency, stop and propose an amendment before adding it.

## Commit Decision

Commit separately as the task `0026` checkpoint after explicit human approval.

## Risks and Open Questions

- Frontend auth state must avoid treating normal guest state as an application
  error.
- Login route redirects should preserve locale without adding unexpected
  redirect loops.
- Shell markup changes may require careful updates to existing catalog tests.
- `credentials: "same-origin"` must be consistently used for auth requests so
  cookie behavior works in browser and tests.
- Playwright auth coverage is intentionally deferred to task `0027`; component
  tests should still leave stable semantic automation surfaces for that task.

## Implementation Summary

- Added frontend auth API schemas, client, query hooks, and error handling
  under `apps/web/src/features/auth/`.
- Added localized `/en/login` and `/ru/login` routes.
- Implemented controlled accessible login form with localized validation,
  invalid credentials, throttling, and unexpected-error UI states.
- Updated the app shell to show guest login link, session loading state,
  authenticated display name, role label, and logout action.
- Kept the session in the backend HTTP-only cookie flow through
  `credentials: "same-origin"`; no frontend token storage was added.
- Added frontend tests for auth client request construction, current-user guest
  mapping, login form validation, user/admin login, shell state, invalid
  credentials, logout, and localized login routes.
- Updated product auth docs, testing strategy, local runbook, and progress.

## Verification Results

- Passed: `node scripts/validate-task-governance.mjs`.
- Passed: `git diff --check`.
- Passed: `pnpm typecheck:web`.
- Passed: `pnpm test:web`.
- Passed: `pnpm build:web`.
