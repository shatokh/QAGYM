# Task 0022: Auth, Roles and Demo Scenarios Planning

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-31 to proceed with
  task `0022`.
- Approved scope notes: Produce a planning-only Phase 2 auth, roles, and demo
  scenarios document; do not implement code, schema, seed, routes,
  dependencies, or tests.

The approved scope is locked for implementation.

## Behavior Type

Docs Only

This task defines the implementation plan for Phase 2. It does not create auth
code, database schema, seed data, routes, UI, dependencies, or tests.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Phase 1 now has a clean catalog core with localized list/detail UI, read API,
deterministic seed data, search/filter discovery, and browser smoke coverage.
The next roadmap phase is Phase 2: authentication, roles, and seeded demo
scenarios for guest, user, and admin behavior.

Auth is a high-impact boundary for the whole training sandbox. It will affect
API contracts, frontend routing, seed data, test strategy, future admin access,
future checkout behavior, and the closed bug guide boundary. The project should
plan the Phase 2 slices before adding auth dependencies or product code.

## Unplanned Work Record

None.

## Scope

Create a practical Phase 2 planning document that defines:

- MVP auth goals and non-goals.
- Guest, user, and admin scenario boundaries.
- Proposed demo accounts and role model at a planning level.
- Auth implementation options and a recommended direction.
- Session/token behavior options and a recommended direction.
- Password/storage safety rules for demo-only credentials.
- Frontend route and access-control expectations.
- Backend API and internal contract impact.
- Database and Prisma model planning boundaries.
- Seed data expectations for repeatable local scenarios.
- Test taxonomy additions for health, clean core behavior, API/contract, and
  Playwright coverage.
- Documentation updates needed before implementation.
- Suggested task split for implementation after this planning task is approved
  and completed.

The plan should keep the existing product direction:

- Local-first development.
- RU/EN-ready UI and URLs.
- Production-style boundaries for an MVP.
- No planned bugs.
- Clean Core first.
- Seed data treated as product behavior.
- No hidden dependencies.

## Out of Scope

- Adding auth libraries or other dependencies.
- Creating or modifying Prisma schema, migrations, generated client output, or
  seed SQL.
- Implementing login, logout, current-user, role guards, route protection, or
  UI flows.
- Adding demo accounts to the database.
- Creating admin, cart, checkout, order, profile, or closed-guide product code.
- Publishing public Swagger/OpenAPI.
- Introducing planned bugs, bug flags, or closed bug guide spoilers.
- Changing existing catalog behavior except where the planning document notes
  future integration points.

## Acceptance Criteria

- A new planning document exists for Phase 2 auth, roles, and demo scenarios.
- The document clearly separates decisions accepted now from decisions that
  require implementation-task approval later.
- The plan recommends a conservative MVP auth approach and explains why.
- Guest, user, and admin expectations are described without implementing them.
- Demo account and seed expectations are explicit enough to support a later
  seed task.
- API, frontend, database, docs, and test impacts are listed.
- The future implementation is split into small reviewable tasks.
- `PROGRESS.md` references task `0022` as in review after implementation.
- Governance validation passes.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Inspect `git status --short` to confirm only task/planning docs changed.

No application tests are required because this is a planning-only task.

## Documentation Impact

- Add `docs/product/auth-roles-demo-scenarios.md`.
- Add `docs/tasks/0022-auth-roles-demo-scenarios-planning.md`.
- Update `PROGRESS.md` with the ready-for-review planning task.

Future approved implementation tasks may update:

- `docs/architecture.md`.
- `docs/local-development.md`.
- `docs/local-runbook.md`.
- `docs/testing-strategy.md`.
- `docs/internal/api/auth.md` or equivalent internal API contract.
- Product docs for auth, account state, and role-based access.

## API Contract Impact

None in this task. The plan should identify future internal auth contract
surfaces, but must not create or change API behavior.

Likely future contract areas:

- `POST /api/v1/auth/login`.
- `POST /api/v1/auth/logout`.
- `GET /api/v1/auth/me`.
- Auth error envelope behavior.
- Role-based access errors.

The exact routes remain subject to a later approved implementation task.

## Seed Data Impact

None in this task. The plan should describe future demo-account and scenario
seed expectations without changing seed files.

## Test Impact

- Health tests: Planning only.
- Clean core behavior tests: Planning only.
- Bug verification tests: None.
- Contract tests: Planning only.
- Performance smoke tests: None.

Future implementation tasks should add targeted API and Playwright coverage
for login, logout, current-user state, role boundaries, and regression-safe
guest behavior.

## Bug Registry Impact

None.

## Dependencies

None.

The planning document may compare dependency options, but it must not add or
install dependencies.

## Commit Decision

Commit separately as the task `0022` checkpoint after explicit human approval
on 2026-07-31.

## Risks and Open Questions

- JWT, cookie session, or hybrid session behavior must be chosen before code.
- Password hashing must be realistic enough for production-style development,
  while demo credentials must remain safe and non-secret.
- Demo accounts are public training fixtures, so the docs must avoid presenting
  them as real secrets.
- Admin role boundaries must be designed now, even if the admin area remains
  Phase 4.
- Closed bug guide access should not be implemented in Phase 2 unless a later
  task explicitly includes it.
- Auth should not force cart, checkout, order, or admin scope into the first
  implementation task.

## Implementation Notes

- Added `docs/product/auth-roles-demo-scenarios.md` as the Phase 2 planning
  baseline.
- The plan recommends database-backed opaque sessions with HTTP-only SameSite
  cookies, one role per account, and two initial enabled demo accounts.
- The plan keeps guest behavior as unauthenticated state rather than a database
  role.
- The plan explicitly defers registration, profile editing, cart, checkout,
  orders, admin area implementation, closed bug guide access, planned bugs, and
  public Swagger/OpenAPI publication.
- The next recommended task is `0023-auth-internal-contract-and-architecture`.

## Verification Results

- Governance validation passed: `22` tasks and `2` proposals.
- `git diff --check` passed.
- `git status --short` shows only `PROGRESS.md`,
  `docs/product/auth-roles-demo-scenarios.md`, and this task file changed.
- No application tests were run because this is a planning-only task with no
  code, schema, seed, dependency, or test changes.

## Proposed Implementation Split

After this planning task is reviewed and approved, use small follow-up tasks:

1. Auth architecture and internal API contract.
2. Auth database schema and demo account seed.
3. Backend clean auth API.
4. Frontend auth shell and localized routes.
5. Role boundary smoke coverage.
