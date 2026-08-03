# Task 0028: Cart, Checkout and Orders Planning

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-03 to proceed with
  task `0028`.
- Approved scope notes: Produce a planning-only Phase 3 cart, checkout, and
  orders document; do not implement code, schema, seed, routes, dependencies,
  tests, public Swagger/OpenAPI, planned bugs, or closed guide behavior.

The approved scope is locked for implementation.

## Behavior Type

Docs Only

This task defines the Phase 3 implementation plan for cart, checkout, and
orders. It does not create product code, database schema, seed data, routes,
UI, dependencies, tests, public Swagger/OpenAPI, planned bugs, or closed guide
behavior.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Phase 2 auth, roles, and demo account work is functionally complete for the
current login shell: the project has deterministic `USER` and `ADMIN` demo
accounts, a clean backend auth API, localized frontend login routes, and
focused Playwright auth smoke coverage. The next roadmap phase is Phase 3:
cart, checkout without real payment, minimum checkout address capture, order
creation, and order history.

Cart and checkout introduce the first authenticated product write APIs beyond
login/logout. The existing auth internal contract explicitly requires future
cart, checkout, order, admin, and closed-guide write APIs to revisit CSRF before
implementation. The project should therefore plan the Phase 3 behavior,
scenario boundaries, API surfaces, seed impact, and test taxonomy before adding
schema, routes, frontend workflows, or write-flow browser tests.

The Phase 3 roadmap acceptance signal is: a seeded user can add comics to a
cart, check out without real payment, and view order history.

## Unplanned Work Record

None.

## Scope

Create a practical Phase 3 planning document that defines:

- MVP cart goals and non-goals.
- Guest, user, and admin boundaries for cart, checkout, and order history.
- Cart ownership and session expectations for authenticated demo users.
- Cart line behavior for adding, quantity changes, removals, and empty carts.
- Product availability, stock, price snapshot, and out-of-stock handling at a
  planning level.
- Checkout without real payment.
- Minimum checkout address fields needed for local order scenarios.
- Order creation, order status, and order history expectations.
- Localization expectations for frontend cart, checkout, and order history UI.
- Database and Prisma model planning boundaries.
- Seed data expectations for repeatable local cart/order scenarios.
- Authenticated write API and CSRF decision points that must be resolved before
  backend implementation.
- Internal API contract areas to create in a later task.
- Clean behavior, contract, and Playwright test expectations.
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
- No real payment, invoicing, email, shipment, or external service integration.

## Out of Scope

- Creating or modifying Prisma schema, migrations, generated client output, or
  seed SQL.
- Implementing backend cart, checkout, order, payment, or admin routes.
- Implementing frontend cart, checkout, order history, or admin UI.
- Adding route guards, CSRF middleware, dependencies, or runtime configuration.
- Creating Jest, Supertest, Vitest, Playwright, or k6 tests.
- Creating public Swagger/OpenAPI.
- Creating the final internal cart/checkout/order API contract; this task may
  identify the needed contract surfaces only.
- Changing existing catalog or auth behavior.
- Adding profile editing, saved addresses, registration, password reset, real
  payment, real shipping, real email, inventory reservations, or invoices.
- Introducing planned bugs, bug flags, bug registry entries, or closed guide
  spoilers.

## Acceptance Criteria

- A new planning document exists for Phase 3 cart, checkout, and orders.
- The document clearly separates decisions accepted now from decisions that
  require later implementation-task approval.
- Cart, checkout, order creation, order history, and minimum address behavior
  are described without implementing them.
- Guest, user, and admin boundaries are explicit.
- The plan identifies which authenticated write APIs require a CSRF decision
  before implementation.
- Seed expectations are explicit enough to support later deterministic fixture
  tasks.
- API, frontend, database, docs, and test impacts are listed.
- Future implementation is split into small reviewable tasks.
- `PROGRESS.md` references task `0028` as in review after implementation.
- Governance validation passes.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Inspect `git status --short` to confirm only task/planning docs changed.

No application tests are required because this is a planning-only task.

## Documentation Impact

- Add `docs/product/cart-checkout-orders.md`.
- Add `docs/tasks/0028-cart-checkout-orders-planning.md`.
- Update `PROGRESS.md` with the ready-for-review planning task after the
  approved docs-only work is complete.

Future approved implementation tasks may update:

- `docs/architecture.md`.
- `docs/local-runbook.md`.
- `docs/testing-strategy.md`.
- `docs/internal/api/cart-checkout-orders.md` or equivalent internal API
  contract.
- Product docs for cart, checkout, orders, address capture, and demo scenarios.

## API Contract Impact

None in this task. The plan should identify future internal API contract
surfaces, but must not create or change API behavior.

Likely future contract areas:

- Cart read and mutation routes.
- Checkout/order creation route.
- Order history route.
- Authenticated write API CSRF behavior.
- Cart, checkout, and order error envelope behavior.
- Order status and price snapshot DTO behavior.

The exact routes remain subject to a later approved internal contract and
architecture task.

## Seed Data Impact

None in this task. The plan should describe future cart/order scenario seed
expectations without changing seed files.

Potential future seed areas:

- User with an empty cart.
- User with existing order history.
- Product states needed for stock, availability, and checkout boundary tests.
- Order records that support local QA scenarios without real payment.

## Test Impact

- Health tests: Planning only.
- Clean core behavior tests: Planning only.
- Bug verification tests: None.
- Contract tests: Planning only.
- Performance smoke tests: Planning only.

Future implementation tasks should add targeted backend API, frontend
component, and Playwright coverage for add-to-cart, quantity changes, removals,
checkout, order creation, order history, authenticated write protection, and
clean guest behavior.

## Bug Registry Impact

None.

Planned cart, checkout, order, pricing, stock, race-condition, or API mismatch
bugs remain out of scope until the clean Phase 3 behavior exists and a later
planned bug registry task explicitly approves them.

## Dependencies

None.

The planning document may compare implementation options, but it must not add
or install dependencies.

## Commit Decision

Group with task 0030 after human commit checkpoint on 2026-08-03.

## Risks and Open Questions

- The first authenticated product write API must resolve whether to add a CSRF
  token strategy or document a bounded local-MVP exception.
- Cart persistence versus short-lived session behavior needs a conservative MVP
  decision before schema design.
- Checkout must decide when prices and item details are snapshotted so later
  catalog edits do not rewrite historical orders.
- Stock behavior must be realistic enough for QA scenarios without introducing
  unapproved inventory reservation complexity.
- Order status values should support Phase 3 user history and later Phase 4
  admin review without overbuilding fulfillment workflows.
- Address capture should stay minimal and checkout-specific, not become full
  profile editing.
- Write-flow Playwright tests will need explicit data isolation or repeatable
  reset behavior before mutating shared demo-account state.

## Proposed Implementation Split

After this planning task is reviewed, approved, and completed, use small
follow-up tasks:

1. Cart, checkout, and order internal API contract and architecture.
2. Cart and order database schema with deterministic seed fixtures.
3. Backend clean cart API.
4. Backend clean checkout and order history API.
5. Frontend localized cart UI.
6. Frontend localized checkout and order history UI.
7. Focused Playwright cart, checkout, and order history smoke coverage.

## Implementation Notes

- Added `docs/product/cart-checkout-orders.md` as the Phase 3 planning
  baseline.
- Recommended authenticated user-only carts for the first MVP cart slice.
- Kept guest cart, anonymous cart merge, real payment, saved addresses, admin
  order management, inventory reservations, and planned bugs out of Phase 3
  planning scope.
- Identified CSRF as a required decision before implementing the first
  authenticated product write API beyond login/logout.
- Recommended one active cart per user, one line per comic, explicit removal,
  checkout-time validation, transactional stock decrement, and order-line price
  snapshots.
- Defined planning boundaries for minimum checkout address, public order
  numbers, order history, future internal API contract surfaces, deterministic
  seed scenarios, and clean test coverage.
- Updated `PROGRESS.md` to show Phase 3 planning and task `0028` in review.

## Verification Results

- Passed: `node scripts/validate-task-governance.mjs`.
- Passed: `git diff --check`.
- `git status --short` shows only `PROGRESS.md`,
  `docs/product/cart-checkout-orders.md`, and this task file changed.
- No application tests were run because this is a docs-only planning task with
  no code, schema, seed, dependency, generated, or test changes.
