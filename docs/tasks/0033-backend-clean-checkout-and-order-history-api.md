# Task 0033: Backend Clean Checkout and Order History API

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-03 to implement task
  `0033` with instruction `апрув приступай`.
- Approved scope notes: Implement backend clean checkout and order-history API
  routes only; do not implement frontend UI, Playwright write-flow coverage,
  planned bugs, public Swagger/OpenAPI, dependencies, schema/migration changes,
  seed fixture changes, or unrelated backend refactoring.

The approved scope is locked for implementation.

## Behavior Type

Clean Feature

This task implements the clean backend checkout and order-history API behavior
from the internal Phase 3 contract. It must not implement frontend UI,
Playwright write-flow coverage, planned bugs, public Swagger/OpenAPI,
dependencies, schema changes, seed fixture changes, or unrelated backend
refactoring.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Tasks `0028` and `0030` established the Phase 3 cart, checkout, and orders
planning and internal API contract. Task `0031` added the cart/order
persistence foundation with `OrderStatus`, `Cart`, `CartLine`, `Order`, and
`OrderLine`. Task `0032` implemented clean backend CSRF token issuance and
cart read/add/update/remove routes.

The next clean backend slice is checkout and order history:

- `POST /api/v1/checkout`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{orderNumber}`

This task should complete the backend side of the Phase 3 acceptance signal:
a seeded `USER` can add comics to a cart, check out without real payment, and
read the resulting order history through API routes.

## Unplanned Work Record

None.

## Scope

### Backend API

Implement these internal contract routes from
`docs/internal/api/cart-checkout-orders.md`:

- `POST /api/v1/checkout`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{orderNumber}`

Add or extend backend checkout/order modules, controllers, services, schemas,
types, and tests following the existing NestJS, Zod, Prisma, and shared
error-envelope style.

Implementation may reuse or narrowly export existing cart/auth/CSRF helpers
from task `0032`. Keep reuse scoped to the checkout/order routes and preserve
existing auth and cart route behavior.

### Auth, Role, and CSRF Boundary

- Reuse the existing `qcg_session` HTTP-only cookie session behavior.
- Require a valid authenticated session for all routes in this task.
- Treat guest as unauthenticated state.
- Allow only `USER` for checkout and order-history routes.
- Return `FORBIDDEN` for authenticated `ADMIN` requests to buyer-only checkout
  and order routes.
- Require `X-QCG-CSRF-Token` for `POST /api/v1/checkout`.
- Do not require CSRF for `GET /api/v1/orders` or
  `GET /api/v1/orders/{orderNumber}`.
- Do not expose numeric database IDs, password/session secrets, CSRF storage
  details, payment credentials, or closed bug guide metadata.

### Checkout Behavior

Implement `POST /api/v1/checkout`:

- Accept optional `locale=en|ru`, default `en`.
- Reject unsupported, empty, repeated, or unknown query parameters.
- Accept JSON body with `address`.
- Validate address fields according to the internal contract:
  - `recipientName`: required string, 1 to 120 characters.
  - `addressLine1`: required string, 1 to 160 characters.
  - `addressLine2`: optional string, 1 to 160 characters when present.
  - `city`: required string, 1 to 120 characters.
  - `region`: optional string, 1 to 120 characters when present.
  - `postalCode`: required string, 1 to 32 characters.
  - `countryCode`: required one of `US`, `PL`, `GB`.
- Reject unknown body fields.
- Return `CART_EMPTY` for an authenticated user's empty or absent cart.
- Revalidate each cart line against current catalog state.
- Reject draft, archived, unknown, deleted, or otherwise non-purchasable cart
  line comics as `COMIC_NOT_FOUND`.
- Reject insufficient stock as `INSUFFICIENT_STOCK`.
- Snapshot order-line comic slug, SKU, localized title, `contentLocale`, unit
  price, line total, quantity, and currency from current catalog records at
  checkout time.
- Create a `PLACED` order.
- Decrement stock for purchased comics.
- Clear purchased cart lines.
- Return HTTP `201` with the created Order Detail DTO.

Checkout must be atomic:

- Do not partially create an order.
- Do not partially create order lines.
- Do not partially decrement stock.
- Do not partially clear cart lines.
- Failed checkout leaves cart state unchanged.

Checkout must not oversell stock under concurrent requests. The implementation
may use Prisma transactions, conditional stock updates, unique-order-number
retry, and narrow raw SQL if needed. If implementation appears to require a
schema change, external lock, queue, dependency, service, or runtime setting,
stop and propose an amendment before implementing.

### Order Number Behavior

Implement the initial public order number format:

```text
QCG-YYYYMMDD-NNNN
```

Rules:

- Use a stable public order number instead of numeric database IDs in API/UI
  surfaces.
- Use the checkout date in UTC for `YYYYMMDD`.
- Use a zero-padded four-digit sequence for the date.
- Preserve uniqueness through the existing database unique constraint.
- If two concurrent checkouts race on the same candidate order number, retry
  safely without creating duplicate orders or leaking database errors.

### Order History Behavior

Implement `GET /api/v1/orders`:

- Accept optional `page` and `pageSize`, default `1` and `12`.
- Reject unsupported, empty, repeated, or unknown query parameters.
- Enforce maximum `pageSize` of `50`.
- Return only orders owned by the authenticated user.
- Sort by creation time descending, then internal order ID descending.
- Return Order Summary DTOs and page metadata.
- Return HTTP `200` with an empty `data` array for a page beyond the final
  page while preserving total metadata.
- Do not expose numeric database IDs.

Implement `GET /api/v1/orders/{orderNumber}`:

- Validate order number format.
- Return only an order owned by the authenticated user.
- Return `ORDER_NOT_FOUND` for unknown orders and orders owned by another user.
- Return Order Detail DTO with address snapshot, order-line snapshots, totals,
  status, order number, and creation timestamp.
- Do not query or render order core display data from mutable cart state.

### DTO Behavior

Use the DTO shapes from `docs/internal/api/cart-checkout-orders.md`:

- `OrderSummary`.
- `OrderDetail`.
- `OrderLine`.
- `CheckoutAddress`.
- Money as integer minor units and ISO currency code.
- Status values from `OrderStatus`.

Order list summary may omit address and detailed line arrays according to the
internal contract, but order detail must include the complete order snapshot.

### Validation and Error Behavior

Implement the documented validation/error behavior for this slice:

- `INVALID_REQUEST`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `CSRF_TOKEN_INVALID`
- `COMIC_NOT_FOUND`
- `INSUFFICIENT_STOCK`
- `CART_EMPTY`
- `CHECKOUT_CONFLICT`
- `ORDER_NOT_FOUND`
- `INTERNAL_ERROR`

Keep error detail ordering deterministic. Do not expose Zod internals, Prisma
metadata, SQL, stack traces, database IDs, session hashes, CSRF token storage,
environment values, payment-provider concepts, or another user's order state.

### API Tests

Add or update backend tests for:

- Checkout success for demo `USER` after adding cart lines through the clean
  cart API.
- Checkout requires a valid CSRF token.
- Checkout rejects guest and admin requests correctly.
- Checkout rejects empty or absent cart as `CART_EMPTY`.
- Checkout validates address body, unknown body fields, and query parameters
  with deterministic errors.
- Checkout snapshots localized titles and `contentLocale` using checkout
  `locale`.
- Checkout creates `PLACED` orders with public order numbers matching
  `QCG-YYYYMMDD-NNNN`.
- Checkout decrements stock and clears purchased cart lines.
- Failed checkout leaves cart lines, stock, orders, and order lines unchanged.
- Draft, archived, unknown, deleted, or stale non-purchasable cart-line comics
  block checkout without leaking internal existence.
- Insufficient stock blocks checkout and does not oversell.
- Concurrent or repeated checkout does not create duplicate order numbers or
  oversell stock.
- Order list returns only the authenticated user's orders, sorted and paginated.
- Order detail returns only the authenticated user's order.
- Unknown and other-user order numbers return `ORDER_NOT_FOUND`.
- DTOs do not expose numeric database IDs, password/session secrets, CSRF
  storage details, payment credentials, or planned bug metadata.
- Existing health, catalog, auth, seed, and cart API tests still pass.

Tests may mutate cart, order, order-line, session, and selected comic stock
rows. They must isolate state and restore deterministic seed behavior before
or after the suite. Do not mutate catalog publication fixtures permanently.

## Out of Scope

- Implementing frontend cart, checkout, or order history UI.
- Adding Playwright cart, checkout, or order history smoke tests.
- Creating public Swagger/OpenAPI.
- Changing Prisma schema, migrations, or seed data unless a scoped amendment is
  approved.
- Adding guest carts, anonymous cart merge, saved addresses, profile editing,
  admin order management, real payment, shipping, email, invoices, inventory
  reservations, promotions, cancellations, refunds, or planned bugs.
- Adding dependencies, Redis, queues, external services, package scripts, or
  runtime requirements.
- Changing catalog API/UI behavior, auth API behavior, or cart API behavior
  outside narrow reuse needed for checkout and order-history routes.
- Implementing public docs publication or training Swagger behavior.

## Acceptance Criteria

- `POST /api/v1/checkout` creates a clean `PLACED` order from the authenticated
  user's non-empty cart.
- Checkout requires valid `X-QCG-CSRF-Token`.
- Guest requests return `UNAUTHENTICATED`.
- Admin requests return `FORBIDDEN`.
- Empty carts return `CART_EMPTY`.
- Checkout validates address, locale, stock, publication state, and stale cart
  line conditions according to the internal contract.
- Checkout creates order-line snapshots, decrements stock, clears purchased
  cart lines, and returns the created Order Detail DTO.
- Checkout is atomic and does not oversell stock in clean behavior.
- Public order numbers match `QCG-YYYYMMDD-NNNN` and do not expose numeric IDs.
- `GET /api/v1/orders` returns only the authenticated user's paginated order
  summaries in deterministic order.
- `GET /api/v1/orders/{orderNumber}` returns only the authenticated user's
  order detail and uses `ORDER_NOT_FOUND` for unknown or other-user orders.
- Relevant unit/API tests pass, including existing health/catalog/auth/cart
  suites.
- Docs and progress are consistent with implementation.
- No frontend UI, Playwright write-flow coverage, planned bug, dependency,
  migration, seed fixture, or unrelated refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run Prisma schema validation if Prisma-generated imports or schema usage
  changes; no schema changes are expected.
- Apply committed migrations to local PostgreSQL.
- Run deterministic seed.
- Run `pnpm test:unit:api`.
- Run `pnpm test:api`.
- Run API typecheck and build.
- Run frontend tests only if frontend files are changed; none are expected.
- Do not run Playwright through Codex for this task unless the human explicitly
  asks for it and confirms the runtime is stable.
- Inspect generated files, secrets, and staged diff before any commit.

## Documentation Impact

- Update `docs/internal/api/cart-checkout-orders.md` from planned target to
  implemented target for checkout and order-history routes.
- Update `docs/product/cart-checkout-orders.md` with implemented backend
  checkout and order-history behavior.
- Update `docs/architecture.md` with backend checkout/order module and
  transaction notes.
- Update `docs/testing-strategy.md` with implemented checkout/order API
  coverage.
- Update `docs/local-runbook.md` with API-level checkout/order checks if
  useful.
- Update `PROGRESS.md` after implementation and verification.

## API Contract Impact

Yes. This task implements the checkout and order-history portions of the
internal cart, checkout, and orders API contract.

If implementation requires changing route names, status codes, DTO shapes,
cookie/session behavior, CSRF header behavior, error codes, order-number
format, checkout transaction behavior, or validation messages, stop and
propose a contract amendment before implementing the change.

Public Swagger/OpenAPI remains unchanged.

## Seed Data Impact

None expected.

Use the existing deterministic seed with empty cart/order tables, existing
catalog stock fixtures, and the two enabled demo accounts. Do not add cart,
order, session, CSRF token, user, or catalog seed fixtures in this task.

Tests may temporarily mutate cart/order/session rows and selected stock values
only when the suite isolates and restores deterministic state.

## Test Impact

- Health tests: Existing public health behavior must remain unaffected.
- Clean core behavior tests: Add backend checkout and order-history API
  coverage.
- Bug verification tests: None.
- Contract tests: Add checkout/order API coverage for routes, DTOs,
  auth/role/CSRF boundaries, validation, transaction behavior, order-number
  behavior, stock behavior, ownership, pagination, and errors.
- Performance smoke tests: None.

## Bug Registry Impact

None.

Planned cart, checkout, pricing, stock, race-condition, order-history, or API
mismatch bugs remain out of scope until clean Phase 3 behavior exists and a
later planned bug registry task explicitly approves them.

## Dependencies

None expected.

Use existing NestJS, Prisma, Zod, Jest, Supertest, PostgreSQL, and Node.js
runtime capabilities. If implementation requires a new dependency, tool,
service, runtime setting, package script, or schema change, stop and propose an
amendment naming it.

## Commit Decision

Committed as `feat(checkout): add clean backend order flow` after explicit
human instruction on 2026-08-03: `комит ипуш`.

## Implementation Notes

- Added backend checkout and order-history routes inside the existing Phase 3
  cart module.
- Added checkout/order Zod schemas, DTO types, controller, service, and shared
  clean error helpers.
- Implemented `POST /api/v1/checkout` with `USER`-only access,
  `X-QCG-CSRF-Token`, checkout address validation, order-line snapshots,
  public order numbers, stock decrement, cart clearing, and transaction
  rollback behavior.
- Implemented `GET /api/v1/orders` and
  `GET /api/v1/orders/{orderNumber}` with user-owned order list/detail DTOs.
- Added DB-backed Supertest coverage in `apps/api/test/checkout.api-spec.ts`.
- Updated internal/product/architecture/testing/runbook/progress docs for the
  implemented backend checkout and order-history routes only. Frontend UI,
  Playwright write-flow coverage, public Swagger/OpenAPI, planned bugs,
  dependencies, schema, migration, and seed fixture changes remain out of
  scope.

## Verification Results

- `corepack pnpm exec prisma migrate deploy` - Passed, no pending migrations.
- `corepack pnpm db:seed` - Passed.
- `corepack pnpm typecheck:api` - Passed.
- `corepack pnpm test:unit:api` - Passed, 5 suites / 15 tests.
- `corepack pnpm db:validate` - Passed.
- `node scripts/validate-task-governance.mjs` - Passed, 33 tasks / 5
  proposals.
- `git diff --check` - Passed.
- `corepack pnpm test:api` - Passed, 7 suites / 51 tests.
- `corepack pnpm build:api` - Passed.
- Playwright was not run; this backend-only task did not change frontend files
  and Playwright write-flow coverage is out of scope.

## Risks and Open Questions

- Order-number generation uses the UTC date prefix and retries unique-number
  conflicts without adding unsupported infrastructure.
- Checkout uses conditional stock updates inside the checkout transaction to
  prevent clean oversell behavior without adding unsupported infrastructure.
- Checkout tests may need controlled stock mutation to verify insufficient
  stock and stale publication branches; the suite isolates this state and
  restores deterministic seed behavior before and after each checkout test.
- Reusing cart and CSRF helpers may require small exports. Keep those exports
  scoped and preserve existing cart/auth API behavior. Implementation reused
  the existing Phase 3 cart module and CSRF service without changing public
  cart/auth behavior.
- This task intentionally leaves frontend cart/checkout/order history UI and
  Playwright write-flow smoke unimplemented, so Phase 3 user-facing acceptance
  is not complete after this backend slice.
