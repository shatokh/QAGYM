# Task 0034: Frontend Localized Cart UI

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-03 to implement task
  `0034` with instruction `апрув приступай`.
- Approved scope notes: Implement frontend localized cart UI only; do not
  implement checkout UI, order-history UI, Playwright write-flow coverage,
  planned bugs, backend API behavior, schema/migration changes, seed fixture
  changes, dependencies, or unrelated frontend refactoring.

The approved scope is locked for implementation.

## Behavior Type

Clean Feature

This task implements the clean frontend cart UI slice for Phase 3. It must not
implement frontend checkout, order history, Playwright write-flow coverage,
planned bugs, backend API behavior, schema changes, seed fixture changes,
dependencies, or unrelated frontend refactoring.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Tasks `0028` and `0030` established the Phase 3 cart, checkout, and orders
planning and internal API contract. Task `0031` added the persistence
foundation. Task `0032` implemented backend CSRF and cart routes. Task `0033`
implemented backend checkout and order-history routes.

The recommended Phase 3 split in `docs/product/cart-checkout-orders.md` makes
the next clean frontend slice:

- Frontend localized cart UI.

This task should make the cart usable from the existing localized catalog UI:
a logged-in `USER` can add published in-stock comics to the cart, open the
localized cart page, change quantities, remove items, and see current totals.
Checkout and order history UI remain a separate follow-up task.

## Unplanned Work Record

None.

## Scope

### Frontend Routes and Navigation

Implement localized cart routes:

- `/en/cart`
- `/ru/cart`

Add route registration, localized document titles, route-level loading/error
states, and navigation entry points consistent with the existing React Router,
i18next, TanStack Query, and app shell patterns.

The cart route should:

- Use the active route locale for API read localization.
- Show a sign-in-required state for guests.
- Show a forbidden/not-available state for authenticated `ADMIN` users if the
  backend returns `FORBIDDEN`.
- Show loading, error, empty cart, and populated cart states.
- Preserve existing catalog/auth route behavior.

### Frontend Cart API Boundary

Add frontend API contract/client/query code for implemented backend routes from
tasks `0032` and `0033` where needed for cart UI:

- `GET /api/v1/csrf-token`
- `GET /api/v1/cart`
- `POST /api/v1/cart/lines`
- `PATCH /api/v1/cart/lines/{comicSlug}`
- `DELETE /api/v1/cart/lines/{comicSlug}`

Use frontend-owned Zod response schemas matching the internal cart DTO
contract. Reuse existing same-origin `/api` request style, cancellation
behavior, error mapping, and TanStack Query conventions.

Cart writes must obtain and send `X-QCG-CSRF-Token`. Do not expose CSRF token
storage details, session secrets, or raw internal backend details in UI state,
test IDs, or logs.

### Add-to-Cart Entry Points

Add clean add-to-cart controls to existing catalog surfaces where they fit the
current UI:

- Catalog list comic cards.
- Product detail route.

Behavior:

- Published in-stock comics can be added with quantity `1`.
- Out-of-stock comics cannot be added and should have clear disabled semantics.
- A successful add updates or invalidates cart state so the cart route reflects
  the backend.
- Add-to-cart pending and error states are observable and accessible.
- The control must not imply checkout, payment, promotions, planned bugs, or
  inventory reservations.

### Cart Page Behavior

The populated cart page should show:

- Cart item title, SKU, cover or fallback behavior, stock state, quantity,
  unit price, line total, and subtotal.
- Quantity controls constrained to `1` through `99`.
- Quantity update behavior through `PATCH`.
- Remove behavior through `DELETE`.
- Current total item count and subtotal using integer minor-unit money from the
  API.
- Stable ordering as returned by the backend.

The cart page must not expose:

- Numeric database IDs.
- Session tokens, CSRF tokens, session hashes, or password data.
- Planned bug IDs, flags, hints, or closed guide metadata.
- Checkout/order state outside the cart DTO.

### Localization and Accessibility

- Add EN/RU copy for cart route states and cart controls.
- Keep API error codes locale-independent and map them to localized UI states
  where useful.
- Preserve explicit locale route prefixes and document language behavior.
- Use semantic controls, labels, headings, status/alert regions, and disabled
  states.
- Follow `docs/conventions/frontend-testability.md`.
- Add stable `data-testid` values only where semantic locators are not enough,
  using stable public slugs where entity-specific selectors are needed.

### Frontend Tests

Add or update frontend unit/component tests for:

- Cart API contract validation and error mapping.
- CSRF token usage for cart mutations.
- Cart route guest, loading, error, empty, and populated states.
- Add-to-cart behavior from catalog list and product detail surfaces.
- Quantity update and remove interactions.
- EN/RU route and copy behavior where relevant.
- No leakage of numeric database IDs, tokens, planned bug metadata, or
  unrelated internal state in rendered output.
- Existing catalog and auth frontend tests still pass.

Use local frontend tests and mocks/fixtures where appropriate. Do not add
Playwright coverage in this task.

## Out of Scope

- Implementing frontend checkout route or checkout form.
- Implementing frontend order history or order detail routes.
- Adding Playwright cart, checkout, or order-history smoke tests.
- Adding backend API behavior, backend tests, Prisma schema/migrations, seed
  fixture changes, or new backend routes.
- Adding public Swagger/OpenAPI.
- Adding guest carts, anonymous cart merge, saved addresses, profile editing,
  admin order management, real payment, shipping, email, invoices, inventory
  reservations, promotions, cancellations, refunds, or planned bugs.
- Adding dependencies, package scripts, runtime requirements, or external
  services.
- Changing existing auth or catalog behavior outside the narrow UI integration
  needed for add-to-cart entry points.

## Acceptance Criteria

- `/en/cart` and `/ru/cart` render localized cart UI states.
- Guests see a sign-in-required cart state rather than cart data.
- Authenticated `USER` can add in-stock published comics from catalog list and
  product detail surfaces.
- Authenticated `USER` can view cart items, update quantities, remove items,
  and see totals.
- Cart writes use `X-QCG-CSRF-Token` through the frontend client.
- Out-of-stock comics have accessible disabled add-to-cart behavior.
- Cart UI handles backend validation, auth, forbidden, CSRF, not-found, and
  stock errors through stable UI states without leaking internals.
- EN/RU localization, route locale, document language, and API locale remain
  synchronized.
- Relevant frontend tests pass, including existing catalog/auth suites.
- Docs and progress are consistent with implementation.
- No checkout UI, order-history UI, Playwright, planned bug, dependency,
  backend API, schema, migration, seed, or unrelated refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run `pnpm typecheck:web`.
- Run `pnpm test:web`.
- Run `pnpm build:web`.
- Run `pnpm test` if the change touches shared frontend behavior enough to
  warrant the aggregate suite.
- Run backend tests only if backend files are changed; none are expected.
- Do not run Playwright through Codex for this task unless the human explicitly
  asks for it and confirms the runtime is stable.
- Inspect generated files, secrets, and staged diff before any commit.

## Documentation Impact

- Update `docs/product/cart-checkout-orders.md` with implemented frontend cart
  UI behavior.
- Update `docs/testing-strategy.md` with implemented frontend cart coverage.
- Update `docs/local-runbook.md` with manual frontend cart checks if useful.
- Update `PROGRESS.md` after implementation and verification.

## API Contract Impact

No backend API contract changes expected.

This task consumes the existing internal cart API contract implemented by task
`0032`. If frontend implementation discovers that the backend route names,
status codes, DTO shapes, CSRF behavior, or validation/error behavior need to
change, stop and propose a backend/API contract amendment before implementing
that change.

Public Swagger/OpenAPI remains unchanged.

## Seed Data Impact

None expected.

Use the existing deterministic seed with the two enabled demo accounts and
empty initial cart/order state. Do not add cart, order, session, CSRF token,
user, or catalog seed fixtures in this task.

## Test Impact

- Health tests: Existing health behavior must remain unaffected.
- Clean core behavior tests: Add frontend cart route and cart interaction
  coverage.
- Bug verification tests: None.
- Contract tests: Add frontend cart DTO/client contract coverage for the
  implemented backend cart API.
- Performance smoke tests: None.

## Bug Registry Impact

None.

Planned cart, checkout, pricing, stock, race-condition, UI mismatch, or API
mismatch bugs remain out of scope until clean Phase 3 behavior exists and a
later planned bug registry task explicitly approves them.

## Dependencies

None expected.

Use existing React, React Router, i18next, TanStack Query, Zod, Vitest, Testing
Library, and current frontend tooling. If implementation requires a new
dependency, tool, service, runtime setting, package script, or backend change,
stop and propose an amendment naming it.

## Commit Decision

Group with task 0035 after explicit human instruction on 2026-08-03.

## Implementation Notes

- Added localized `/en/cart` and `/ru/cart` routes with guest, forbidden,
  loading, error, empty, and populated cart states.
- Added frontend cart API schemas/client/query mutations for CSRF token
  retrieval, cart reads, add, update, and remove line operations.
- Added add-to-cart controls to catalog cards and product detail pages,
  including disabled out-of-stock semantics.
- Added localized EN/RU cart copy and scoped styling for cart navigation,
  cart route states, item rows, quantity controls, and summary totals.
- Added frontend fixtures and Vitest coverage for cart API behavior, CSRF
  header use, guest/admin route boundaries, add/update/remove interactions,
  localized copy, disabled out-of-stock actions, and secrecy checks.
- Updated product, testing, local runbook, and progress documentation.

## Verification Results

- `corepack pnpm typecheck:web` - passed.
- `corepack pnpm test:web` - passed, 12 files and 57 tests.
- `corepack pnpm build:web` - passed.
- `corepack pnpm test` - passed, including backend unit tests and frontend
  unit/component tests.
- `node scripts/validate-task-governance.mjs` - passed.
- `git diff --check` - passed.
- Database-backed backend API tests were not run because this task did not
  change backend files or API behavior.
- Playwright was not run through Codex per task scope and current project
  guidance.

## Risks and Open Questions

- Cart mutations make frontend component tests more stateful than current
  catalog read tests; use focused mocks/fixtures and avoid broad workflow
  coupling.
- Add-to-cart controls must fit existing catalog card/detail layouts without
  turning this into a broad visual redesign.
- Checkout route and order-history route are intentionally absent in this
  task, so the Phase 3 browser workflow remains incomplete after this slice.
- Guest and admin cart states should be useful without implying unsupported
  guest cart or admin buyer behavior.
