# Cart, Checkout and Orders Plan

## Purpose

This document defines the Phase 3 planning baseline for cart, checkout, and
orders in QA Comics Gym.

It records the clean MVP direction before any cart, checkout, order schema,
API, UI, seed, or tests are implemented. Future approved tasks still need to
turn this plan into internal API contracts, Prisma models, backend behavior,
frontend workflows, deterministic fixtures, and browser smoke coverage.

## Current Planning Status

Accepted for planning now:

- Phase 3 should add the first shopping workflow after catalog and auth.
- The clean workflow is authenticated user cart, checkout without real payment,
  order creation, and order history.
- The existing `USER` demo account is the primary buyer scenario.
- The existing `ADMIN` demo account should remain available for later Phase 4
  order review scenarios, but Phase 3 does not implement admin order
  management.
- Guest catalog browsing stays public and unauthenticated.
- Cart, checkout, and order behavior must be clean core behavior first, with no
  planned bugs.
- Checkout address capture is checkout-specific and minimal; full profile and
  saved address management remain later scope.
- Seed data for cart/order scenarios must be deterministic and resettable.
- Internal behavior/API contracts and clean tests should be created with the
  implementation tasks that introduce the behavior.

Still requiring implementation-task approval:

- Exact database schema and migration.
- Backend implementation for the accepted internal contract.
- Exact frontend route names and localized UI copy.
- Exact seed fixture records.
- Exact Playwright and API test cases.
- Any stock decrement, order status, or order-history edge-case behavior that
  goes beyond this planning direction.

Implemented by task `0030` at the documentation level:

- Internal cart, checkout, and order API contract at
  `docs/internal/api/cart-checkout-orders.md`.
- Planned route names, DTO field names, status codes, and error codes.
- Same-origin CSRF token route and `X-QCG-CSRF-Token` header requirement for
  authenticated cart and checkout writes.
- `USER`-only buyer route boundary for the first Phase 3 slice.
- Checkout transaction, stock decrement, order number, order snapshot, and
  order history semantics.

Implemented by task `0031`:

- Prisma `OrderStatus`, `Cart`, `CartLine`, `Order`, and `OrderLine`
  persistence foundation.
- Committed `cart_order_foundation` migration.
- Deterministic seed reset for cart and order tables.
- Empty initial cart/order fixture state.
- DB-backed seed and persistence constraint verification.

## MVP Goals

Phase 3 should make these scenarios possible:

- Guest: browse the clean catalog and product detail pages without a cart.
- User: log in with the seeded demo user, add published comics to a cart,
  change quantities, remove items, check out without real payment, and view
  order history.
- Admin: remain able to log in and see authenticated shell state, while admin
  order management remains Phase 4 scope.

The Phase 3 acceptance signal from the roadmap is:

- A seeded user can add comics to a cart, check out, and view order history.

## MVP Non-Goals

Phase 3 should not include:

- Guest or anonymous carts.
- Cart merge across anonymous and authenticated sessions.
- Wishlists.
- Saved addresses.
- Full profile editing.
- Registration or self-service account creation.
- Real payment providers.
- Payment authorization, capture, refunds, or invoices.
- Real tax calculation.
- Real shipping carriers, shipment tracking, or fulfillment integration.
- Inventory reservations, warehouses, backorders, or stock history.
- Admin order management.
- Email confirmations.
- Promotions, coupons, dynamic discounts, or discount engines.
- Multi-currency checkout.
- Planned cart, checkout, pricing, stock, race-condition, or API mismatch bugs.

## Terminology

- Cart: The current mutable shopping basket for one authenticated user.
- Cart line: One comic and quantity inside a cart.
- Checkout: The action that validates the current cart, captures the minimum
  shipping/contact address, creates an order, and clears the purchased cart
  lines.
- Checkout address: The minimum address snapshot captured for one order.
- Order: An immutable purchase record created by checkout without real payment.
- Order line: One purchased comic snapshot inside an order.
- Order number: A stable public order identifier used by APIs, UI, seed docs,
  and automation instead of numeric database IDs.
- Price snapshot: The copied item price, currency, SKU, and title information
  stored on an order line at checkout time.

## Scenario Boundaries

### Guest

Guest remains unauthenticated state, not a database role.

Clean guest behavior:

- Can browse `/en/comics`, `/ru/comics`, and product detail routes.
- Cannot read or mutate cart state.
- Cannot check out.
- Cannot view order history.
- Should receive unauthenticated behavior for cart, checkout, and order
  history routes or APIs.

Future frontend tasks should decide whether guest cart links route to login,
show a sign-in-required state, or stay hidden until authenticated. That UI
choice must be approved in the frontend task.

### User

`USER` is the primary Phase 3 buyer role.

Clean user behavior:

- Can read their own cart.
- Can add published available comics to their own cart.
- Can update and remove their own cart lines.
- Can check out their own non-empty valid cart.
- Can view their own order list and order detail.
- Cannot read or mutate another user's cart or orders.
- Cannot access admin order-management surfaces.

### Admin

`ADMIN` exists from Phase 2 but Phase 3 does not add admin order management.

Recommended clean Phase 3 boundary:

- Admin can remain authenticated.
- Admin should not automatically manage orders until Phase 4.
- Admin may be denied buyer-only checkout if the internal contract chooses to
  keep checkout as `USER`-only.
- Alternatively, admin may be allowed to use buyer flows if the contract treats
  admin as a superset role. This must be decided explicitly before backend
  implementation.

Recommendation for the first Phase 3 implementation: keep buyer checkout
`USER`-only unless a task names an admin buyer scenario. This keeps role
coverage deterministic and avoids implying admin order management before Phase
4.

## Cart Behavior

Recommended MVP direction:

- One active cart per authenticated user.
- No anonymous cart.
- Cart identity is server-side and tied to the authenticated user, not to a
  client-provided ID.
- Cart lines use stable comic identity, preferably comic slug or SKU at the API
  boundary.
- A cart has at most one line for a given comic.
- Adding the same comic again increases the existing line quantity.
- Quantity is a positive integer.
- Removing a line deletes it from the cart.
- Empty cart is a valid state.
- Cart reads should show enough item data for the UI to render without exposing
  numeric database IDs.

Clean add/update rules:

- Only published comics can be added.
- Draft, archived, or unknown comics return the same safe not-found behavior as
  catalog detail.
- Out-of-stock comics cannot be added.
- Quantity changes cannot produce a quantity below `1`.
- Quantity changes above available stock should be rejected with a stable clean
  error.
- Cart totals are derived from current catalog prices until checkout creates an
  order.

Accepted contract decisions from task `0030`:

- Maximum quantity per line is `99`.
- Quantity `0` is invalid.
- Removal uses explicit `DELETE /api/v1/cart/lines/{comicSlug}`.
- Add requests merge with an existing line for the same comic and reject
  resulting quantities above current stock.

Deferred cart decisions:

- Whether stale cart lines for newly archived comics remain visible as
  unavailable or are removed during cart reads.
- Whether users can keep unavailable lines in cart for QA visibility.

The internal API contract defines stale non-purchasable comics at the cart API
boundary as not purchasable for writes and as checkout blockers.

## Availability and Stock

The existing catalog exposes stock quantity and derived availability. Phase 3
must build on that without adding inventory-reservation complexity.

Recommended clean stock behavior:

- Cart reads do not reserve stock.
- Adding or updating a cart line validates against current stock.
- Checkout revalidates all cart lines against current publication state and
  stock.
- Checkout succeeds only when every line is still published and available in
  the requested quantity.
- Successful checkout decrements stock for purchased comics in the same
  database transaction that creates the order.
- Failed checkout does not partially create an order, decrement stock, or clear
  the cart.

Out of scope:

- Holding stock while an item sits in cart.
- Backorders.
- Warehouses.
- Stock history.
- Concurrent inventory reservation systems.

Clean checkout should still be transactionally correct enough that two
simultaneous checkouts cannot oversell a comic. Later planned race-condition
bugs must be introduced through the planned bug layer, not as accidental clean
behavior.

## Pricing and Totals

Catalog prices are stored as integer minor units with an ISO currency code.
Phase 3 should preserve that representation.

Recommended clean pricing behavior:

- Cart line prices are derived from the current comic price at read time.
- Cart totals are calculated from current cart line quantities and current
  catalog prices.
- Comparison price remains display-only and does not affect checkout totals.
- No tax, shipping cost, coupon, promotion, or payment fee is applied in the
  MVP.
- Checkout stores an order-line price snapshot for every purchased line.
- Order totals are calculated from order-line snapshots, not from current
  catalog prices.
- Historical order totals do not change when catalog prices change later.

The initial seed uses only `USD`. Multi-currency checkout is out of scope.

## Checkout Without Payment

Checkout is the clean transition from mutable cart to immutable order.

Recommended clean checkout behavior:

- User must be authenticated.
- Cart must be non-empty.
- Checkout request must include the minimum checkout address.
- All requested cart lines must still be valid, published, and in stock.
- Successful checkout creates one order with one or more order lines.
- Successful checkout clears purchased cart lines.
- Successful checkout returns the created order summary or order detail.
- Failed checkout returns a stable JSON error envelope and leaves cart state
  unchanged.
- No real payment is collected or simulated against an external service.

Payment posture:

- Do not model card numbers, card tokens, or payment provider identifiers.
- Do not ask users for payment credentials.
- Do not store fake payment secrets.
- If an order needs a payment-related field later, prefer an explicit local
  value such as `NO_PAYMENT_REQUIRED` rather than fake provider state.

## Minimum Checkout Address

The address belongs to the order snapshot. It is not a saved user profile.

Recommended minimum fields:

- Recipient name.
- Address line 1.
- Address line 2, optional.
- City.
- Region or state, optional.
- Postal code.
- Country code.

Accepted contract decisions from task `0030`:

- Required fields are recipient name, address line 1, city, postal code, and
  country code.
- Optional fields are address line 2 and region.
- Initial country-code allowlist is `US`, `PL`, and `GB`.
- Phone number is not part of the first internal contract.

Exact user-facing UI copy for validation remains frontend implementation scope.

## Orders and History

Orders are historical records. They should not depend on mutable cart or
catalog rows for their core display data.

Recommended order behavior:

- Every order has a stable public order number.
- Order numbers, not numeric database IDs, are used by APIs, UI routes, docs,
  and automation.
- Orders belong to one user.
- Users can view only their own orders.
- Order list is ordered by creation time descending, then internal ID
  descending as a deterministic tie-breaker.
- Order detail shows order number, status, timestamps, address snapshot, line
  snapshots, quantities, line totals, and order total.
- Order line snapshots include comic SKU, slug, localized title selected at
  checkout time or an agreed fallback, price minor units, currency, and
  quantity.

Recommended initial order statuses:

- `PLACED`
- `CANCELLED`

The first checkout implementation should create `PLACED` orders only.
`CANCELLED` is useful for later seed/admin scenarios but does not require Phase
3 cancellation UI.

Accepted contract decisions from task `0030`:

- Order detail by public order number is part of the planned internal contract.
- Order history is paginated with page/pageSize behavior matching existing
  page-based API conventions.
- Initial order-number format is `QCG-YYYYMMDD-NNNN`.
- Phase 3 checkout creates `PLACED` orders only.

Order status mutation remains Phase 4 or later scope.

## Frontend Surface Planning

Future frontend implementation should preserve explicit locale prefixes.

Likely localized routes:

- `/en/cart`
- `/ru/cart`
- `/en/checkout`
- `/ru/checkout`
- `/en/orders`
- `/ru/orders`
- Optional detail: `/en/orders/:orderNumber` and `/ru/orders/:orderNumber`

Frontend clean states should be observable and accessible:

- Guest sign-in-required state.
- Loading state.
- Empty cart.
- Populated cart.
- Quantity update pending state.
- Remove pending state.
- Cart validation error.
- Checkout form validation errors.
- Checkout conflict or unavailable-item error.
- Checkout success navigation.
- Empty order history.
- Populated order history.
- Order not found or forbidden state.

The UI should use semantic locators first and stable `data-testid` values only
where accessible identity is insufficient, following
`docs/conventions/frontend-testability.md`.

## Backend and API Planning

The internal contract belongs to `docs/internal/api/cart-checkout-orders.md`.
Accepted planned surfaces:

- `GET /api/v1/csrf-token`
- `GET /api/v1/cart`
- `POST /api/v1/cart/lines`
- `PATCH /api/v1/cart/lines/{comicSlug}`
- `DELETE /api/v1/cart/lines/{comicSlug}`
- `POST /api/v1/checkout`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{orderNumber}`

Recommended API boundary rules:

- All cart, checkout, and order history APIs are under `/api/v1`.
- All Phase 3 product write APIs require authentication.
- User-facing DTOs do not expose numeric database IDs.
- DTOs use integer minor-unit money and ISO currency codes.
- Error envelopes follow the existing shared JSON error conventions.
- Draft, archived, unknown, and unauthorized resources should avoid leaking
  internal existence unless the internal contract explicitly allows otherwise.
- Backend validation uses Zod unless a later approved task changes direction.

Stable error areas:

- Unauthenticated.
- Forbidden.
- Invalid request body.
- Invalid CSRF token.
- Cart line not found.
- Product not found or not purchasable.
- Insufficient stock.
- Empty cart.
- Checkout conflict.
- Order not found.

Exact status codes and error codes are locked in the internal contract before
backend implementation.

## Authenticated Writes and CSRF

Cart and checkout introduce authenticated state-changing product APIs beyond
login/logout. SameSite `Lax` remains useful but is not the full CSRF strategy.

Accepted contract decision from task `0030`:

- Add an explicit same-origin CSRF token strategy for browser writes.
- Provide `GET /api/v1/csrf-token` for authenticated `USER` sessions.
- Require a custom `X-QCG-CSRF-Token` header on authenticated browser write
  requests.
- Keep API behavior locale-independent.
- Do not add hidden dependencies; any CSRF helper dependency must be named in
  the approved task.

The exact token storage and frontend request wiring remain future
implementation scope.

## Database Planning

Implemented model areas:

- Cart.
- Cart line.
- Order.
- Order line.
- Checkout address snapshot fields on `Order`.
- Order status enum.

Implemented persistence boundaries:

- Internal IDs may be database-generated integers.
- Public order identity should be stable and non-numeric.
- Cart ownership should reference the user.
- Cart line identity should prevent duplicate lines for the same cart and
  comic.
- Order line snapshots should not rely on mutable catalog price/title data.
- Currency and money should remain integer minor units plus ISO currency code.
- Timestamps should use the existing database timestamp convention.
- Check constraints should enforce positive quantities, non-negative money,
  valid totals, non-blank address fields, and consistent order-line data where
  practical.

The first migration enforces one active cart per user, one line per cart and
comic, quantity range `1` to `99`, public order-number format, non-blank
address and snapshot fields, country-code allowlist, non-negative money, line
total consistency, uppercase currency codes, and useful lookup indexes.

CSRF token persistence was not added in task `0031`; future CSRF
implementation may use session-bound storage, in-memory local storage, or a
separate approved schema change if needed.

## Seed Scenario Planning

Seed data is product behavior. Phase 3 seed changes must be explicit in the
approved schema/seed task.

Implemented first seed direction:

- Keep the existing two enabled demo accounts.
- Start the demo user with no cart.
- Do not seed sessions.
- Do not seed CSRF tokens.
- Do not seed orders or order lines.
- Keep existing catalog fixture records unchanged.
- Verify that cart and order tables are empty after deterministic reset.

Potential later seed scenarios:

- User with empty cart and empty order history.
- User with a populated cart.
- User with one placed order.
- User with multiple orders for pagination or sorting.
- Cancelled order for status display.
- Order near a timezone boundary.
- Order containing a comic that later becomes unavailable.

Recommendation: do not add extra users solely for Phase 3 unless write-flow
test isolation requires it and the approved task names that need.

## Testing Plan

Health tests:

- `GET /health` remains public and unaffected by cart/order data.
- Database seed reset remains repeatable.

Clean core behavior tests:

- Add to cart succeeds for valid published in-stock comics.
- Duplicate add increments or updates one line, depending on the approved API
  contract.
- Quantity update validates positive integer quantity and stock.
- Remove deletes a cart line.
- Empty cart is represented cleanly.
- Checkout creates an order and clears purchased cart lines.
- Checkout rejects empty, unauthenticated, invalid, unpublished, or
  insufficient-stock carts.
- User order history contains created orders and does not expose another
  user's orders.

Contract tests:

- Cart, checkout, and order DTOs match the internal API contract.
- Error envelopes remain stable.
- Money and order snapshots do not expose floating-point totals or numeric
  database IDs.

Frontend tests:

- Localized cart, checkout, and order routes render expected states.
- Frontend request clients validate response contracts.
- Form validation is covered at component level.
- Locale prefixes and document language remain stable.

Playwright E2E:

- Future focused smoke should cover user login, add to cart, checkout, and
  order history through the real frontend, backend, and PostgreSQL runtime.
- Write-flow tests need explicit data isolation or deterministic reset before
  mutating shared demo-account state.
- Do not duplicate exhaustive API validation in Playwright.

Bug verification tests:

- None in Phase 3 clean tasks.

Performance smoke tests:

- Not required for the first implementation tasks.
- k6 checkout smoke remains later scope.

## Documentation Plan

Future implementation tasks should update:

- `docs/internal/api/cart-checkout-orders.md`.
- `docs/product/cart-checkout-orders.md` with accepted implementation details.
- `docs/local-runbook.md` with manual cart/checkout/order checks.
- `docs/testing-strategy.md` with implemented cart/order test coverage.
- `PROGRESS.md` with accepted decisions and task status.

Public Swagger/OpenAPI publication remains Phase 5 scope unless an earlier
approved task explicitly creates a public API document.

## Recommended Task Split

Recommended next Phase 3 tasks:

1. Cart and order database schema with deterministic seed fixture decisions.
2. Backend clean CSRF and cart API.
3. Backend clean checkout and order history API.
4. Frontend localized cart UI.
5. Frontend localized checkout and order history UI.
6. Focused Playwright cart, checkout, and order history smoke coverage.

This split keeps contract, persistence, backend behavior, frontend behavior,
and browser coverage reviewable. It also creates an explicit checkpoint for
CSRF before the first authenticated product write API.

## Decisions Accepted for Future Implementation Tasks

- Use authenticated user-only carts for the first MVP cart slice.
- Use one active cart per user.
- Do not implement anonymous cart or cart merge in the MVP.
- Use one cart line per comic and explicit delete for line removal.
- Reject quantity `0`; allow cart line quantities from `1` to `99`.
- Validate stock on add/update and again at checkout.
- Decrement stock transactionally when checkout creates an order.
- Snapshot order-line prices, currency, SKU, slug, title, and content locale at
  checkout.
- Use no real payment and no payment credentials.
- Keep checkout address as an order snapshot, not a saved user profile.
- Use public order numbers rather than numeric database IDs in API/UI surfaces.
- Use a same-origin CSRF token route and `X-QCG-CSRF-Token` header before
  implementing Phase 3 write routes.
