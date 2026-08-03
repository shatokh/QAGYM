# Task 0032: Backend Clean CSRF and Cart API

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-03 to implement task
  `0032`.
- Approved scope notes: Implement backend clean CSRF token route and cart API
  routes only; do not implement checkout, order history, frontend UI,
  Playwright write-flow coverage, planned bugs, dependencies, public
  Swagger/OpenAPI, schema/migration changes, seed fixture changes, or unrelated
  backend refactoring.

The approved scope is locked for implementation.

## Behavior Type

Clean Feature

This task implements the clean backend CSRF token route and cart API behavior
from the internal Phase 3 contract. It must not implement checkout, order
history, frontend UI, Playwright write-flow coverage, planned bugs, or unrelated
backend refactoring.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Tasks `0028` and `0030` established the Phase 3 cart, checkout, and orders
planning and internal API contract. Task `0031` added the cart/order
persistence foundation with `Cart`, `CartLine`, `Order`, `OrderLine`, and
`OrderStatus`, plus deterministic reset behavior that starts with no cart or
order rows.

The next clean slice is the first authenticated product write surface beyond
login/logout:

- `GET /api/v1/csrf-token`
- `GET /api/v1/cart`
- `POST /api/v1/cart/lines`
- `PATCH /api/v1/cart/lines/{comicSlug}`
- `DELETE /api/v1/cart/lines/{comicSlug}`

This task should implement only CSRF token issuance/validation and current-user
cart behavior. Checkout and order history remain separate follow-up tasks.

## Unplanned Work Record

None.

## Scope

### Backend API

Implement these internal contract routes from
`docs/internal/api/cart-checkout-orders.md`:

- `GET /api/v1/csrf-token`
- `GET /api/v1/cart`
- `POST /api/v1/cart/lines`
- `PATCH /api/v1/cart/lines/{comicSlug}`
- `DELETE /api/v1/cart/lines/{comicSlug}`

Add backend cart/CSRF modules, controllers, services, schemas, and tests
following the existing NestJS, Zod, Prisma, and shared error-envelope style.

### Auth and Role Boundary

- Reuse the existing `qcg_session` HTTP-only cookie session behavior.
- Require a valid authenticated session for all routes in this task.
- Treat guest as unauthenticated state.
- Allow only `USER` for the first cart slice.
- Return `FORBIDDEN` for authenticated `ADMIN` requests to buyer-only cart and
  CSRF routes.
- Do not expose numeric database IDs, password/session secrets, CSRF storage
  details, or closed bug guide metadata.

If the existing auth implementation needs small extraction to share current
session/user validation with cart routes, keep it narrowly scoped and preserve
existing auth API behavior. Do not redesign auth.

### CSRF Behavior

Implement the same-origin CSRF contract for cart writes:

- `GET /api/v1/csrf-token` returns `{ data: { csrfToken } }` for a valid `USER`
  session.
- CSRF tokens provide at least `128` bits of entropy.
- Tokens are bound to the authenticated session.
- Tokens are not passwords or session tokens.
- Raw CSRF tokens are not persisted.
- `POST`, `PATCH`, and `DELETE` cart routes require `X-QCG-CSRF-Token`.
- Missing, malformed, expired, unknown, or session-mismatched tokens return
  `CSRF_TOKEN_INVALID` with HTTP `403`.
- Logout or an invalid/missing session makes the token unusable.

No new schema is approved for CSRF in this task. Use a local MVP
implementation such as process-local token storage keyed by session token hash,
or another dependency-free approach that satisfies the observable contract.
If implementation appears to require schema, dependency, external cache, Redis,
or runtime configuration, stop and propose an amendment.

### Cart Read Behavior

Implement `GET /api/v1/cart`:

- Accept optional `locale=en|ru`, default `en`.
- Reject unsupported, empty, repeated, or unknown query parameters.
- Return an empty cart DTO when the user has no cart.
- Return cart lines owned by the authenticated user only.
- Use current catalog prices and current catalog localized titles.
- Preserve nullable cover paths.
- Use integer minor-unit money.
- Compute line totals, `totalItems`, and `subtotal`.
- Order cart lines by first-added timestamp ascending, then comic slug
  ascending.
- Do not create a cart as a side effect of a read.

### Cart Mutation Behavior

Implement `POST /api/v1/cart/lines`:

- Accept JSON body with `comicSlug` and `quantity`.
- Create the user's cart if no active cart exists.
- Add a new line when the comic is not already in cart.
- Increase the existing line quantity when the comic is already in cart.
- Reject resulting quantity above `99`.
- Reject resulting quantity above current stock.
- Reject unknown, draft, archived, and out-of-stock comics as
  `COMIC_NOT_FOUND`.
- Return the updated Cart DTO on success.

Implement `PATCH /api/v1/cart/lines/{comicSlug}`:

- Accept JSON body with `quantity`.
- Reject quantity `0`; removal uses `DELETE`.
- Update an existing line to the exact quantity.
- Reject missing cart lines as `CART_LINE_NOT_FOUND`.
- Reject quantity above `99`.
- Reject quantity above current stock.
- Reject stale lines whose comic is no longer purchasable.
- Return the updated Cart DTO on success.

Implement `DELETE /api/v1/cart/lines/{comicSlug}`:

- Require CSRF token.
- Use idempotent removal for the authenticated user's own cart.
- Return HTTP `204` with an empty body when the line is absent or removed.
- Do not reveal another user's cart state.

### Validation and Error Behavior

Implement the documented validation/error behavior for this slice:

- `INVALID_REQUEST`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `CSRF_TOKEN_INVALID`
- `COMIC_NOT_FOUND`
- `CART_LINE_NOT_FOUND`
- `INSUFFICIENT_STOCK`
- `INTERNAL_ERROR`

Keep error detail ordering deterministic. Do not expose Zod internals, Prisma
metadata, SQL, stack traces, database IDs, session hashes, CSRF token storage,
or environment values.

### API Tests

Add or update backend tests for:

- CSRF token success for demo `USER`.
- CSRF token forbidden for demo `ADMIN`.
- Missing/invalid CSRF token rejection on cart writes.
- Empty cart read for the demo user after deterministic seed.
- Cart read rejects unauthenticated and admin requests correctly.
- Add published in-stock comic to cart.
- Duplicate add merges into one line.
- Quantity update succeeds.
- Quantity `0`, quantity above `99`, unknown body fields, invalid slugs, and
  repeated/unknown query parameters return stable validation errors.
- Out-of-stock, draft, archived, and unknown comics cannot be added.
- Insufficient stock returns `INSUFFICIENT_STOCK` where the comic is
  purchasable but requested quantity exceeds stock.
- Remove cart line returns `204` and is idempotent.
- DTOs do not expose numeric database IDs, session secrets, CSRF storage
  details, or planned bug metadata.
- Existing health, catalog, auth, and seed API tests still pass.

Tests may mutate cart tables. They must isolate state by cleaning only the
cart/cart-line rows they create or by using the deterministic seed preparation
before the suite. Do not mutate catalog fixture data.

### Documentation

- Update `docs/internal/api/cart-checkout-orders.md` from planned target to
  implemented target for CSRF and cart routes only.
- Update `docs/product/cart-checkout-orders.md` with implemented backend cart
  behavior.
- Update `docs/architecture.md` with backend cart/CSRF module notes.
- Update `docs/testing-strategy.md` with implemented cart API coverage.
- Update `docs/local-runbook.md` with API-level CSRF/cart checks if useful.
- Update `PROGRESS.md` after implementation and verification.

## Out of Scope

- Implementing `POST /api/v1/checkout`.
- Implementing `GET /api/v1/orders` or `GET /api/v1/orders/{orderNumber}`.
- Creating orders, order lines, order numbers, address validation behavior, or
  stock decrement behavior.
- Implementing frontend cart, checkout, or order history UI.
- Adding Playwright cart, checkout, or order history smoke tests.
- Creating public Swagger/OpenAPI.
- Changing Prisma schema, migrations, or seed data unless a scoped amendment is
  approved.
- Adding guest carts, anonymous cart merge, saved addresses, profile editing,
  admin order management, real payment, shipping, email, invoices, inventory
  reservations, promotions, or planned bugs.
- Adding dependencies, Redis, queues, external services, package scripts, or
  runtime requirements.
- Changing catalog API/UI behavior or auth API behavior outside narrow reuse
  needed for authenticated cart routes.

## Acceptance Criteria

- `GET /api/v1/csrf-token` is implemented for authenticated `USER` sessions.
- Cart write routes require valid `X-QCG-CSRF-Token`.
- Missing/invalid CSRF tokens return the documented `403` envelope.
- `GET /api/v1/cart` returns an empty cart for the seeded demo user after
  reset.
- Cart add/update/remove routes behave according to the internal contract.
- Admin requests to buyer-only CSRF/cart routes return `FORBIDDEN`.
- Guest requests return `UNAUTHENTICATED`.
- Cart DTOs use current catalog data, integer minor-unit money, stable slugs,
  nullable cover paths, and no numeric database IDs.
- Stock, publication-state, quantity, duplicate-line, and removal behavior
  match the contract.
- Relevant unit/API tests pass, including existing health/catalog/auth suites.
- Docs and progress are consistent with implementation.
- No checkout, order history, frontend UI, planned bug, dependency, migration,
  seed fixture, or unrelated refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Run Prisma schema validation if Prisma-generated imports or schema usage
  changes; no schema changes are expected.
- Generate Prisma Client only if needed and confirm generated output remains
  ignored.
- Apply committed migrations to local PostgreSQL.
- Run deterministic seed.
- Run `pnpm test:unit:api`.
- Run `pnpm test:api`.
- Run API typecheck and build.
- Run frontend tests only if frontend files are changed; none are expected.
- Inspect generated files, secrets, and staged diff before any commit.

## Documentation Impact

- Update `docs/internal/api/cart-checkout-orders.md`.
- Update `docs/product/cart-checkout-orders.md`.
- Update `docs/architecture.md`.
- Update `docs/testing-strategy.md`.
- Update `docs/local-runbook.md` if API check commands are added.
- Update `PROGRESS.md`.

## API Contract Impact

Yes. This task implements the CSRF token and cart portions of the internal
cart, checkout, and orders API contract.

If implementation requires changing route names, status codes, DTO shapes,
cookie/session behavior, CSRF header behavior, error codes, or validation
messages, stop and propose a contract amendment before implementing the
change.

Public Swagger/OpenAPI remains unchanged.

## Seed Data Impact

None expected.

Use the existing deterministic seed with empty cart/order tables and the two
enabled demo accounts. Do not add cart, order, session, CSRF token, user, or
catalog seed fixtures in this task.

## Test Impact

- Health tests: Existing public health behavior must remain unaffected.
- Clean core behavior tests: Add backend CSRF and cart service/API coverage.
- Bug verification tests: None.
- Contract tests: Add CSRF/cart API coverage for routes, DTOs, auth/role
  boundaries, validation, and errors.
- Performance smoke tests: None.

## Bug Registry Impact

None.

Planned cart, checkout, pricing, stock, race-condition, or API mismatch bugs
remain out of scope until clean Phase 3 behavior exists and a later planned bug
registry task explicitly approves them.

## Dependencies

None expected.

Use Node.js built-in cryptography and existing NestJS, Prisma, Zod, Jest, and
Supertest tooling. If implementation requires a new dependency, tool, service,
runtime setting, or package script, stop and propose an amendment naming it.

## Commit Decision

Committed as `feat(cart): add clean backend cart api` after explicit human
instruction on 2026-08-03: `комит и далее`.

## Implementation Notes

- Added backend cart and CSRF modules under `apps/api/src/cart/`.
- Exposed shared authenticated session validation from `AuthService` without
  changing the existing auth API routes or response DTOs.
- Implemented dependency-free local MVP CSRF tokens using Node.js crypto,
  process-local hashed token storage, session-token-hash binding, and
  `X-QCG-CSRF-Token` validation for cart writes.
- Implemented `USER`-only cart reads and mutations with current catalog DTO
  data, localized read support, duplicate-line merging, exact quantity updates,
  idempotent removal, quantity/stock/publication-state checks, and stable JSON
  error envelopes.
- Added DB-backed Supertest coverage in `apps/api/test/cart.api-spec.ts`.
- Updated internal/product/architecture/testing/runbook/progress docs for the
  implemented CSRF and cart routes only. Checkout, order history, frontend UI,
  Playwright write-flow coverage, planned bugs, dependencies, schema,
  migration, and seed fixture changes remain out of scope.

## Verification Results

- `corepack pnpm typecheck:api` - Passed.
- `corepack pnpm test:unit:api` - Passed, 5 suites / 15 tests.
- `corepack pnpm exec prisma migrate deploy` - Passed, no pending migrations.
- `corepack pnpm db:seed` - Passed.
- `corepack pnpm test:api` - Passed, 6 suites / 44 tests.
- `corepack pnpm db:validate` - Passed.
- `corepack pnpm build:api` - Passed.
- `node scripts/validate-task-governance.mjs` - Passed, 32 tasks / 5
  proposals.
- `git diff --check` - Passed.

## Risks and Open Questions

- Process-local CSRF token storage is acceptable for the local MVP but is not a
  distributed production CSRF design. It is documented in the internal API
  contract and architecture notes.
- Sharing auth session validation with cart routes may require careful
  extraction from the existing auth service. Existing auth behavior remained
  covered by unit and API tests.
- Cart API tests mutate cart rows, so isolation must be explicit and must not
  touch catalog fixture data. The added API tests clean only cart/cart-line
  rows and sessions before each case.
- Add/update behavior must distinguish not-purchasable comics from
  insufficient-stock requests without leaking draft/archived existence. API
  tests cover unknown, draft, archived, out-of-stock, and insufficient-stock
  branches.
- This task intentionally leaves checkout and order history unimplemented, so
  Phase 3 acceptance is not complete after this slice.
