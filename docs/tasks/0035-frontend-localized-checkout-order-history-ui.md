# Task 0035: Frontend Localized Checkout and Order History UI

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-03 for task `0035`
  with instruction `approve`.
- Approved scope notes: Implement frontend localized checkout and order-history
  UI only; do not implement Playwright write-flow coverage, backend API
  behavior, schema/migration changes, seed changes, dependencies, planned bugs,
  admin order management, real payment, or unrelated frontend refactoring.

The approved scope is locked for implementation.

## Behavior Type

Clean Feature

This task implements the clean frontend checkout and order-history UI slice for
Phase 3. It must not implement Playwright write-flow coverage, backend API
behavior, schema changes, seed changes, dependencies, planned bugs, admin order
management, real payment, or unrelated frontend refactoring.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Tasks `0028` and `0030` established the Phase 3 cart, checkout, and orders
planning and internal API contract. Task `0031` added the cart/order
persistence foundation. Task `0032` implemented backend CSRF and cart routes.
Task `0033` implemented backend checkout and order-history routes. Task `0034`
implemented the localized frontend cart UI.

The recommended Phase 3 split in `docs/product/cart-checkout-orders.md` makes
the next clean frontend slice:

- Frontend localized checkout and order history UI.

This task should complete the user-facing clean Phase 3 MVP workflow: a logged
in `USER` can add comics to the cart, check out without payment using a minimum
address, and view the created order in localized order history and detail
routes.

## Unplanned Work Record

None.

## Scope

### Frontend Routes and Navigation

Implement localized buyer routes:

- `/en/checkout`
- `/ru/checkout`
- `/en/orders`
- `/ru/orders`
- `/en/orders/:orderNumber`
- `/ru/orders/:orderNumber`

Add route registration, localized document titles, route-level loading/error
states, and navigation entry points consistent with existing React Router,
i18next, TanStack Query, and app shell patterns.

Allowed cart UI integration:

- Add a localized checkout entry point from the populated cart route.
- Add localized order-history navigation from the app shell or another
  existing authenticated buyer surface where it fits the current UI.

### Frontend Checkout and Order API Boundary

Add frontend API contract/client/query code for implemented backend routes:

- `GET /api/v1/csrf-token`
- `POST /api/v1/checkout`
- `GET /api/v1/orders`
- `GET /api/v1/orders/{orderNumber}`

Use frontend-owned Zod response schemas matching
`docs/internal/api/cart-checkout-orders.md`.

Checkout writes must obtain and send `X-QCG-CSRF-Token`. Do not expose CSRF
token storage details, session secrets, numeric database IDs, raw backend
internals, planned bug metadata, or closed guide details in UI state, test IDs,
or logs.

### Checkout Page Behavior

The checkout page should:

- Use the active route locale for checkout title snapshots.
- Require authenticated `USER` buyer access.
- Show sign-in-required behavior for guests.
- Show forbidden/not-available behavior for authenticated `ADMIN` users.
- Read the current cart before checkout and show empty-cart behavior if there
  are no cart lines.
- Show order summary data sufficient for the buyer to confirm items and total.
- Capture the minimum checkout address:
  - Recipient name.
  - Address line 1.
  - Address line 2, optional.
  - City.
  - Region, optional.
  - Postal code.
  - Country code limited to `US`, `PL`, and `GB`.
- Validate required fields and country code client-side before submit.
- Submit `POST /api/v1/checkout?locale=<route-locale>`.
- On success, navigate to the localized order detail route for the returned
  public order number.
- Handle backend validation, auth, forbidden, CSRF, empty-cart, stock, conflict,
  and generic error states through stable localized UI states.

The checkout page must not:

- Ask for card numbers, fake payment credentials, coupons, shipping methods,
  tax data, saved addresses, profile updates, or email confirmation.
- Implement inventory reservation or admin order management.

### Order History and Detail Behavior

The order list page should:

- Require authenticated `USER` buyer access.
- Show sign-in-required behavior for guests.
- Show forbidden/not-available behavior for authenticated `ADMIN` users.
- Render loading, error, empty, and populated states.
- Read `GET /api/v1/orders` with page/pageSize query behavior.
- Display public order number, status, created date, total item count, and total.
- Link each order to its localized order detail route.
- Support basic pagination using the backend pagination metadata.

The order detail page should:

- Require authenticated `USER` buyer access.
- Render loading, error, not-found, and populated states.
- Read `GET /api/v1/orders/{orderNumber}`.
- Display public order number, status, created date, checkout address snapshot,
  order lines, quantities, unit prices, line totals, total item count, and
  order total.
- Use order-line snapshots as returned by the API rather than current catalog
  reads.

### Localization and Accessibility

- Add EN/RU copy for checkout, order list, order detail, validation messages,
  and route states.
- Preserve explicit locale route prefixes and document language behavior.
- Use semantic controls, labels, headings, status/alert regions, and disabled
  states.
- Follow `docs/conventions/frontend-testability.md`.
- Add stable `data-testid` values only where semantic locators are not enough,
  using public order numbers or public slugs where entity-specific selectors
  are needed.

### Frontend Tests

Add or update frontend unit/component tests for:

- Checkout and order DTO validation and error mapping.
- CSRF token usage for checkout mutation.
- Checkout route guest, admin, loading, empty-cart, validation, error, and
  success-navigation behavior.
- Minimum address form validation.
- Order list empty, populated, error, and pagination behavior.
- Order detail populated and not-found/error behavior.
- EN/RU route and copy behavior where relevant.
- No leakage of numeric database IDs, tokens, planned bug metadata, or
  unrelated internal state in rendered output.
- Existing catalog, auth, and cart frontend tests still pass.

Use local frontend tests and mocks/fixtures where appropriate. Do not add
Playwright coverage in this task.

## Out of Scope

- Adding Playwright cart, checkout, or order-history smoke tests.
- Adding backend API behavior, backend tests, Prisma schema/migrations, seed
  fixture changes, or new backend routes.
- Adding public Swagger/OpenAPI.
- Adding guest carts, anonymous cart merge, saved addresses, profile editing,
  admin order management, real payment, shipping, tax, email, invoices,
  inventory reservations, promotions, cancellations, refunds, or planned bugs.
- Adding dependencies, package scripts, runtime requirements, or external
  services.
- Changing existing auth, catalog, cart, checkout, or order API behavior.
- Broad frontend visual redesign or unrelated frontend refactoring.

## Acceptance Criteria

- `/en/checkout` and `/ru/checkout` render localized clean checkout UI states.
- Authenticated `USER` can submit a valid minimum checkout address for a
  populated cart and is navigated to the localized order detail route.
- Checkout writes use `X-QCG-CSRF-Token` through the frontend client.
- Guests and authenticated `ADMIN` users see appropriate buyer-route boundary
  states for checkout and orders.
- Empty-cart checkout behavior is handled without attempting checkout.
- `/en/orders` and `/ru/orders` render localized empty and populated order-list
  states with pagination behavior.
- `/en/orders/:orderNumber` and `/ru/orders/:orderNumber` render localized
  order detail states using order snapshot data.
- EN/RU localization, route locale, document language, and API locale remain
  synchronized.
- Relevant frontend tests pass, including existing catalog, auth, and cart
  suites.
- Docs and progress are consistent with implementation.
- No Playwright, planned bug, dependency, backend API, schema, migration, seed,
  payment, admin management, or unrelated refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run `pnpm typecheck:web`.
- Run `pnpm test:web`.
- Run `pnpm build:web`.
- Run `pnpm test` because this task touches shared frontend routing and app
  shell behavior.
- Run backend tests only if backend files are changed; none are expected.
- Do not run Playwright through Codex for this task unless the human explicitly
  asks for it and confirms the runtime is stable.
- Inspect generated files, secrets, and staged diff before any commit.

## Documentation Impact

- Update `docs/product/cart-checkout-orders.md` with implemented frontend
  checkout and order-history behavior.
- Update `docs/testing-strategy.md` with implemented frontend checkout/order
  coverage.
- Update `docs/local-runbook.md` with manual frontend checkout/order checks.
- Update `PROGRESS.md` after implementation and verification.

## API Contract Impact

No backend API contract changes expected.

This task consumes the existing internal checkout and order-history API
contract implemented by task `0033`. If frontend implementation discovers that
route names, status codes, DTO shapes, CSRF behavior, validation messages, or
error behavior need to change, stop and propose an API contract/backend
amendment before implementing that change.

Public Swagger/OpenAPI remains unchanged.

## Seed Data Impact

None expected.

Use the existing deterministic seed with the two enabled demo accounts and
empty initial cart/order state. Do not add cart, order, session, CSRF token,
user, catalog, or order-history seed fixtures in this task.

## Test Impact

- Health tests: Existing health behavior must remain unaffected.
- Clean core behavior tests: Add frontend checkout and order-history route and
  interaction coverage.
- Bug verification tests: None.
- Contract tests: Add frontend checkout/order DTO/client contract coverage for
  the implemented backend API.
- Performance smoke tests: None.

## Bug Registry Impact

None.

Planned cart, checkout, order-history, pricing, stock, race-condition, UI
mismatch, or API mismatch bugs remain out of scope until clean Phase 3 behavior
exists and a later planned bug registry task explicitly approves them.

## Dependencies

None expected.

Use existing React, React Router, i18next, TanStack Query, Zod, Vitest, Testing
Library, and current frontend tooling. If implementation requires a new
dependency, tool, service, runtime setting, package script, or backend change,
stop and propose an amendment naming it.

## Commit Decision

Commit after this task with grouped task 0034 after explicit human instruction
on 2026-08-03.

## Implementation Notes

- Added localized `/en/checkout` and `/ru/checkout` routes with buyer-only
  auth boundaries, current-cart loading/error/empty states, order summary, and
  minimum checkout address form.
- Added localized `/en/orders`, `/ru/orders`,
  `/en/orders/:orderNumber`, and `/ru/orders/:orderNumber` routes with order
  list, pagination, order detail, not-found/error, guest, and admin states.
- Added frontend checkout/order Zod contracts, same-origin client, TanStack
  Query hooks, CSRF-backed checkout mutation, and order fixtures.
- Added checkout navigation from populated cart state and order-history
  navigation from the app shell.
- Added EN/RU checkout and order copy, status labels, address labels, and
  scoped styles for checkout/order surfaces.
- Added frontend Vitest coverage for checkout client CSRF use, order reads,
  checkout form validation, checkout success navigation, empty-cart blocking,
  order list/detail flows, localized order states, and secrecy checks.

## Verification Results

- `corepack pnpm typecheck:web` - passed.
- `corepack pnpm test:web` - passed, 14 files and 66 tests.
- `corepack pnpm build:web` - passed with a Vite chunk-size warning after the
  frontend route growth.
- `corepack pnpm test` - passed, including backend unit tests and frontend
  unit/component tests.
- `node scripts/validate-task-governance.mjs` - passed.
- `git diff --check` - passed.
- Database-backed backend API tests were not run because this task did not
  change backend files or API behavior.
- Playwright was not run through Codex per task scope and current project
  guidance.

## Risks and Open Questions

- Checkout and order history complete the Phase 3 user-facing path, but the
  browser-level runtime smoke remains a separate task because write-flow
  isolation needs explicit approval.
- This task will likely touch the same frontend shell and route files as task
  `0034`; grouping the eventual commit is compatible because both are clean
  frontend Phase 3 work.
- Checkout success mutates shared demo-account cart/order/stock state at
  runtime. Frontend unit tests should use mocks and avoid relying on persistent
  local database state.
- The order list starts from an empty deterministic seed, so manual populated
  order checks require creating an order through checkout first.
