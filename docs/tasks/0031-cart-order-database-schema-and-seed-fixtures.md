# Task 0031: Cart and Order Database Schema and Seed Fixtures

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-03 to implement task
  `0031`.
- Approved scope notes: Implement cart and order persistence schema, committed
  migration, deterministic seed reset support, seed/integrity verification, and
  supporting docs only; do not implement backend routes, frontend UI,
  Playwright write-flow coverage, planned bugs, dependencies, public
  Swagger/OpenAPI, or populated cart/order fixtures.

The approved scope is locked for implementation.

## Behavior Type

Clean Feature

This task adds the clean Phase 3 cart and order persistence foundation and
deterministic reset behavior. The schema migration and seed changes directly
represent the approved product model for cart, checkout, and order history.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Task `0028` created the Phase 3 cart, checkout, and orders planning baseline.
Task `0030` created the internal API contract and architecture direction:
authenticated `USER`-only buyer routes, one active server-side cart per user,
one cart line per comic, explicit line deletion, quantity range `1` to `99`,
checkout without real payment, transactional stock decrement, checkout-address
snapshots, public order numbers, order-line snapshots, and same-origin CSRF
tokens for cart and checkout writes.

Before backend cart, checkout, order history, CSRF route behavior, frontend UI,
or Playwright write-flow coverage can be implemented, the database needs stable
cart/order models and the deterministic seed reset must understand the new
tables. This task must preserve existing catalog and auth behavior.

## Unplanned Work Record

None.

## Scope

### Prisma Schema and Migration

Add the cart/order persistence model to `prisma/schema.prisma` and a committed
migration.

Planned enum:

- `OrderStatus` with `PLACED` and `CANCELLED`.

Planned cart model areas:

- `Cart` model.
- `CartLine` model.

Planned order model areas:

- `Order` model.
- `OrderLine` model.
- Checkout address snapshot fields on `Order` or an explicitly justified
  one-to-one address snapshot model.

Planned cart fields:

- Database-generated integer internal ID.
- User relationship.
- Creation and update timestamps.
- Relationship to cart lines.

Planned cart line fields:

- Database-generated integer internal ID, unless a composite key is cleaner.
- Cart relationship.
- Comic relationship.
- Positive quantity.
- Creation timestamp for deterministic display order.
- Update timestamp.

Planned order fields:

- Database-generated integer internal ID.
- Stable public order number in the format `QCG-YYYYMMDD-NNNN`.
- User relationship.
- Order status.
- Checkout address snapshot fields:
  - recipient name;
  - address line 1;
  - optional address line 2;
  - city;
  - optional region;
  - postal code;
  - country code.
- Total item count.
- Total amount in integer minor units.
- Currency code.
- Creation and update timestamps.
- Relationship to order lines.

Planned order line fields:

- Database-generated integer internal ID, unless a composite key is cleaner.
- Order relationship.
- Optional comic relationship for internal traceability, without relying on it
  for historical display.
- Comic slug snapshot.
- SKU snapshot.
- Title snapshot.
- Content locale snapshot.
- Quantity.
- Unit price in integer minor units.
- Line total in integer minor units.
- Currency code.
- Creation timestamp.

Database constraints should enforce:

- One active cart per user.
- One cart line per cart and comic.
- Cart and order quantities are positive and at most `99`.
- Order totals and line totals are non-negative.
- Currency codes are three uppercase letters.
- Order number format.
- Order line snapshots have non-blank slug, SKU, title, and content locale.
- Checkout address required fields are non-blank.
- Country code is one of `US`, `PL`, or `GB`.
- Order status is constrained to the planned enum.
- Useful indexes for user cart lookup, cart line lookup, user order history,
  public order number lookup, and order-line order lookup.

If implementation needs schema-backed CSRF token storage to satisfy task
`0030`, add only the minimum session-bound persistence needed for future CSRF
implementation, such as a token hash and timestamp on `Session` or a small
CSRF token table. Do not implement token generation or route behavior in this
task. If the required CSRF persistence would be broader than a small supporting
schema change, stop and propose an amendment.

### Seed Data

Extend the deterministic seed reset so new cart/order tables are truncated in a
safe order.

Initial seed expectations:

- Keep the existing two enabled demo accounts unchanged.
- Keep existing catalog fixture records unchanged unless an approved amendment
  is required for a schema constraint.
- Do not create preexisting sessions.
- Do not create preexisting CSRF tokens.
- Start with no carts and no orders unless implementation discovers that empty
  state cannot verify the schema usefully; if populated cart/order fixtures
  become necessary, stop and propose an amendment.
- Seed verification must confirm new cart/order tables are empty after reset.

### Verification and Tests

- Add or update database integrity checks for the cart/order schema.
- Add seed verification that confirms deterministic reset includes the new
  tables and starts with no cart/order rows.
- Keep this task free of backend route behavior tests; those belong to later
  backend API tasks.
- Existing catalog and auth tests must keep passing.

### Documentation

- Update `docs/product/cart-checkout-orders.md` with implemented schema and
  seed decisions.
- Update `docs/architecture.md` with implemented cart/order persistence notes.
- Update `docs/local-runbook.md` only if seed/reset command behavior or manual
  setup expectations change.
- Update `docs/testing-strategy.md` only if verification commands or taxonomy
  details change materially.
- Update `PROGRESS.md` after implementation and verification.

## Out of Scope

- Implementing `GET /api/v1/csrf-token` or CSRF token generation/validation.
- Implementing `GET /api/v1/cart`, cart mutation routes, `POST
  /api/v1/checkout`, or order history routes.
- Implementing NestJS controllers, services, guards, middleware, interceptors,
  route handlers, or DTO validators.
- Implementing frontend cart, checkout, or order history UI.
- Adding Playwright cart, checkout, or order history smoke tests.
- Creating public Swagger/OpenAPI.
- Adding populated cart/order fixtures unless approved by amendment.
- Adding guest carts, anonymous cart merge, saved addresses, profile editing,
  admin order management, real payment, shipping, email, invoices, inventory
  reservations, promotions, or planned bugs.
- Changing existing catalog API/UI behavior or auth API behavior.
- Adding dependencies, runtime requirements, package scripts, or services.

## Acceptance Criteria

- Prisma schema contains cart/order persistence models and `OrderStatus` with
  documented clean constraints.
- A committed migration applies cleanly to PostgreSQL.
- The deterministic seed reset includes the new cart/order tables in the
  correct dependency order.
- The seed starts with no cart/order rows and preserves the existing catalog
  and auth fixture behavior.
- Database constraints enforce ownership, uniqueness, quantity, money,
  address, country-code, order-number, snapshot, and timestamp invariants where
  practical.
- Relevant seed/integrity verification passes.
- Existing backend unit tests and database-backed API tests still pass.
- Docs and progress are consistent with implementation.
- No backend API routes, frontend UI, planned bug, dependency, or unrelated
  refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run Prisma schema validation.
- Generate Prisma Client and confirm generated output remains ignored.
- Apply committed migrations to local PostgreSQL.
- Run deterministic seed.
- Verify Prisma migration status.
- Run database-backed seed/integrity checks.
- Run existing backend unit tests.
- Run existing database-backed API tests to confirm catalog and auth behavior
  remain intact.
- Run frontend tests only if frontend files are changed; none are expected.
- Inspect `git status --short` for generated files before commit.

## Documentation Impact

- Update `docs/product/cart-checkout-orders.md`.
- Update `docs/architecture.md`.
- Update `PROGRESS.md`.
- Update `docs/local-runbook.md` only if local reset/setup expectations change.
- Update `docs/testing-strategy.md` only if verification taxonomy details
  change materially.

## API Contract Impact

None expected. `docs/internal/api/cart-checkout-orders.md` remains the planned
contract target from task `0030`; this task adds persistence and seed support
only.

If implementation reveals a contract issue, stop and propose an amendment
instead of silently changing the contract.

## Seed Data Impact

Yes. Extend the deterministic seed reset with cart/order tables. The approved
initial fixture state is empty cart/order tables, not populated carts or
orders.

## Test Impact

- Health tests: Existing health behavior must remain unaffected.
- Clean core behavior tests: Add seed/integrity checks for cart and order
  persistence.
- Bug verification tests: None.
- Contract tests: Existing catalog and auth contract tests must keep passing;
  cart/checkout/order API contract tests remain future backend task scope.
- Performance smoke tests: None.

## Bug Registry Impact

None.

Planned cart, checkout, order, pricing, stock, race-condition, or API mismatch
bugs remain out of scope until clean Phase 3 behavior exists and a later
planned bug registry task explicitly approves them.

## Dependencies

None expected.

If implementation requires a new dependency, tool, service, runtime setting, or
package script, stop and propose an amendment naming the dependency and why it
belongs in this task.

## Commit Decision

Commit after this task after explicit human approval on 2026-08-03.

## Risks and Open Questions

- CSRF persistence may be simplest as session-bound fields, but the first
  backend CSRF task might prefer an in-memory or derived approach. Keep any
  schema support minimal and stop if the choice expands.
- Order-number generation must be deterministic enough for tests while not
  relying on public numeric database IDs.
- Checkout needs future transaction logic to avoid overselling; this schema
  task should provide constraints and indexes without implementing checkout.
- Empty cart/order seed state is simplest, but later Playwright write-flow
  tests may need isolated fixture data or reset behavior.
- Prisma relations must preserve existing catalog/auth seed reset behavior
  without using broad `CASCADE` truncation.

## Implementation Notes

- Added `OrderStatus`, `Cart`, `CartLine`, `Order`, and `OrderLine` to
  `prisma/schema.prisma`.
- Added migration `20260803143000_cart_order_foundation`.
- Added database constraints for one active cart per user, one line per cart
  and comic, quantity range `1` to `99`, public order-number format,
  non-blank address and snapshot fields, country-code allowlist,
  non-negative money, line-total consistency, and uppercase currency codes.
- Extended the deterministic seed reset to truncate cart/order tables before
  auth and catalog tables without `CASCADE`.
- Kept the initial cart/order fixture state empty: no carts, cart lines,
  orders, or order lines.
- Added DB-backed seed and persistence verification in
  `apps/api/test/cart-order-seed.api-spec.ts`.
- Updated architecture, product, catalog seed, local runbook, testing strategy,
  and progress docs.
- Did not add CSRF persistence because the planned CSRF implementation can
  still choose session-bound, in-memory local, or later approved schema-backed
  storage.
- Did not implement backend routes, frontend UI, populated fixtures,
  Playwright write-flow coverage, dependencies, public Swagger/OpenAPI, or
  planned bugs.

## Verification Results

- Passed: `corepack pnpm db:format`.
- Passed: `corepack pnpm db:validate`.
- Passed: `corepack pnpm db:generate`; generated output remains ignored.
- Passed: `corepack pnpm infra:up` after Docker Engine was started by the
  human owner.
- Passed: `corepack pnpm exec prisma migrate deploy`; migration
  `20260803143000_cart_order_foundation` applied.
- Passed: `corepack pnpm db:seed`.
- Passed: `corepack pnpm exec prisma migrate status`; database schema is up to
  date.
- Passed: `corepack pnpm test:api`: `5` suites, `34` tests.
- Passed: `corepack pnpm test:unit:api`: `5` suites, `15` tests.
- Passed: `corepack pnpm typecheck:api`.
- Passed: `node scripts/validate-task-governance.mjs`.
- Passed: `git diff --check`.
- Not run: frontend tests, because no frontend source files changed.
- Earlier DB verification attempts failed before Docker Engine/container access
  was available; rerun after Docker was started passed.
