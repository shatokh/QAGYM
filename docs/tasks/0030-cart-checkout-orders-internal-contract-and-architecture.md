# Task 0030: Cart, Checkout and Orders Internal API Contract and Architecture

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-03 to proceed with
  task `0030`.
- Approved scope notes: Create the internal cart, checkout, and order API
  contract and supporting architecture/product/testing documentation only; do
  not implement code, schema, seed, routes, dependencies, tests, public
  Swagger/OpenAPI, planned bugs, or closed guide behavior.

The approved scope is locked for implementation.

## Behavior Type

Docs Only

This task turns the accepted Phase 3 cart, checkout, and orders planning
direction into an internal developer API contract and supporting architecture
notes. It does not implement cart, checkout, order, schema, seed, routes, UI,
tests, public Swagger/OpenAPI, planned bugs, or closed guide behavior.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Task `0028` established the Phase 3 planning baseline: authenticated user-only
carts for the first MVP slice, checkout without real payment, minimum checkout
address capture, order creation with price snapshots, user order history, and a
required CSRF decision before the first authenticated product write API beyond
login/logout.

Before Prisma schema, backend routes, frontend workflows, seed fixtures, or
write-flow Playwright tests are implemented, the project needs an internal API
contract and architecture record for cart, checkout, and orders. This keeps the
first Phase 3 implementation tasks small and prevents schema, backend,
frontend, tests, and seed data from drifting.

## Unplanned Work Record

None.

## Scope

Create and update documentation only:

- Add `docs/internal/api/cart-checkout-orders.md` defining the planned internal
  API contract for:
  - reading the current user's cart;
  - adding a comic to cart;
  - updating cart line quantity;
  - removing a cart line;
  - checking out the current cart;
  - listing current-user orders;
  - reading current-user order detail by public order number, if included in
    the first contract slice.
- Define planned request and response shapes at the documentation level.
- Define planned cart, cart line, checkout address, order summary, order
  detail, order line, money, and error DTO fields.
- Define fields that must never be exposed, including numeric database IDs,
  raw session tokens, password hashes, and closed bug guide metadata.
- Define planned authentication and role semantics for guest, `USER`, and
  `ADMIN` behavior.
- Make an explicit CSRF decision for authenticated cart and checkout writes, or
  document the exact bounded local-MVP exception.
- Define planned stock, publication-state, quantity, price snapshot, order
  total, and checkout transaction semantics.
- Define planned order-number and order-status semantics.
- Define locale-independent API behavior and any localized snapshot rules.
- Define planned JSON error envelope behavior for cart, checkout, and order
  surfaces.
- Update `docs/architecture.md` with cart, checkout, order, and CSRF
  architecture notes.
- Update `docs/product/cart-checkout-orders.md` with accepted contract
  decisions and clarified deferred decisions.
- Update `docs/testing-strategy.md` with cart, checkout, order, CSRF, contract,
  and Playwright test expectations.
- Update `PROGRESS.md` with task status and accepted decisions.

The task may recommend dependency-free or dependency-backed CSRF approaches for
later implementation, but must not add, install, or lock a dependency.

Recommended decisions to evaluate in this task:

- Use authenticated `USER`-only cart and checkout routes for the first slice.
- Use one active server-side cart per user.
- Use one cart line per comic.
- Use explicit delete for removal and reject quantity `0`.
- Validate current stock on add, update, and checkout.
- Decrement stock transactionally when checkout creates an order.
- Store order-line snapshots for price, currency, SKU, slug, and title.
- Use public order numbers in API and UI surfaces.
- Add a same-origin CSRF token strategy for cart and checkout writes.

## Out of Scope

- Creating or modifying Prisma schema, migrations, generated client output, or
  seed SQL.
- Implementing backend controllers, services, guards, middleware, CSRF helpers,
  route handlers, or database queries.
- Implementing frontend cart, checkout, order history, auth request wiring, or
  UI states.
- Adding dependencies, runtime configuration, package scripts, or environment
  variables.
- Creating Jest, Supertest, Vitest, Playwright, or k6 tests.
- Creating public Swagger/OpenAPI.
- Adding demo cart, order, or address seed records.
- Changing existing catalog or auth behavior.
- Adding guest carts, cart merge, profile editing, saved addresses, admin order
  management, real payment, real shipping, real email, invoices, inventory
  reservations, or promotions.
- Introducing planned bugs, bug flags, bug registry entries, or closed guide
  spoilers.

## Acceptance Criteria

- `docs/internal/api/cart-checkout-orders.md` exists and clearly defines the
  planned internal API surface.
- Route names, DTO field names, status codes, and error codes are stable enough
  for later implementation tasks.
- Authenticated write and CSRF behavior is explicit.
- Cart ownership, quantity, duplicate-line, stock, publication-state, and
  checkout validation semantics are explicit.
- Checkout transaction and failure behavior is explicit enough for backend and
  API tests.
- Order status, order number, order-line snapshot, and order-history behavior
  are explicit.
- API behavior is locale-independent except for documented snapshot fields.
- The contract does not expose numeric database IDs, password/session secrets,
  or planned bug/closed guide details.
- `docs/architecture.md`, `docs/product/cart-checkout-orders.md`, and
  `docs/testing-strategy.md` are consistent with the new contract.
- The task records which decisions are accepted and which remain deferred.
- No code, schema, seed, dependency, generated, or test files are changed.
- Governance validation passes.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Inspect `git status --short` to confirm only documentation and progress files
  changed.

No application tests are required because this is a docs-only contract and
architecture task.

## Documentation Impact

- Add `docs/internal/api/cart-checkout-orders.md`.
- Update `docs/architecture.md`.
- Update `docs/product/cart-checkout-orders.md`.
- Update `docs/testing-strategy.md`.
- Update `PROGRESS.md`.

## API Contract Impact

Yes. This task creates the internal developer cart, checkout, and order API
contract only.

Public Swagger/OpenAPI remains unchanged and should be handled in a later
public documentation phase or explicitly approved Swagger task.

## Seed Data Impact

None. This task may define expected future cart/order seed identities and
scenarios, but it must not modify seed files.

## Test Impact

- Health tests: Document that platform health remains public and unaffected.
- Clean core behavior tests: Define expected future cart, checkout, and order
  behavior coverage.
- Bug verification tests: None.
- Contract tests: Define expected future cart, checkout, and order contract
  coverage.
- Performance smoke tests: Document later k6 checkout smoke expectations only
  if useful.

No tests are created in this task.

## Bug Registry Impact

None.

Planned cart, checkout, pricing, stock, race-condition, or API mismatch bugs
remain out of scope until clean Phase 3 behavior exists and a later planned bug
registry task explicitly approves them.

## Dependencies

None.

Future implementation tasks must explicitly approve any dependency used for
CSRF handling, request utilities, or cart/order support.

## Commit Decision

Group with task 0031 after human commit checkpoint on 2026-08-03.

## Risks and Open Questions

- A CSRF strategy adds protocol and frontend wiring complexity, but deferring it
  creates risk for the first authenticated product write surface.
- The contract must avoid over-specifying database internals before schema
  design while still being precise enough for implementation.
- Stock decrement and checkout transaction behavior must be clean and
  testable without introducing inventory reservation scope.
- Order title snapshot localization must be precise enough for UI tests and
  history behavior.
- Admin role behavior needs a clear Phase 3 boundary so order management does
  not leak in before Phase 4.
- Future write-flow Playwright tests will need isolation or reset behavior;
  this task should document expectations without implementing them.

## Implementation Notes

- Added `docs/internal/api/cart-checkout-orders.md` as the planned internal API
  contract for Phase 3 cart, checkout, and orders.
- Defined planned routes for CSRF token issuance, current cart, cart line add,
  update, and removal, checkout, order list, and order detail.
- Accepted `USER`-only buyer routes for the first Phase 3 slice, with `ADMIN`
  returning `FORBIDDEN` on buyer routes until Phase 4 admin order management.
- Accepted same-origin CSRF behavior using `GET /api/v1/csrf-token` and
  `X-QCG-CSRF-Token` on authenticated cart and checkout writes.
- Defined cart, checkout address, order summary, order detail, order line,
  money, pagination, and error envelope shapes.
- Defined checkout transaction behavior, stock decrement, order number format,
  order statuses, localized title snapshot behavior, and field-exclusion rules.
- Updated architecture, product planning, testing strategy, and progress docs
  to align with the planned internal contract.

## Verification Results

- Passed: `node scripts/validate-task-governance.mjs`.
- Passed: `git diff --check`.
- `git status --short` shows documentation and progress changes only:
  `PROGRESS.md`, `docs/architecture.md`, `docs/testing-strategy.md`,
  `docs/internal/api/cart-checkout-orders.md`,
  `docs/product/cart-checkout-orders.md`, task `0028`, and this task file.
- No application tests were run because this is a docs-only contract and
  architecture task with no code, schema, seed, dependency, generated, or test
  changes.
