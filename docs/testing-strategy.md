# Testing Strategy

QA Comics Gym needs a special test taxonomy because the product will contain intentional bugs. Tests must distinguish platform health, clean expected behavior, and registered planned bug behavior.

The goal is not to make every test pass against every bug mode. The goal is to make test intent explicit.

## Incremental Coverage Rule

Clean feature behavior should gain relevant tests with the feature once the
required test foundation exists. The project must not build all clean product
behavior first and defer its first tests until Phase 8.

Infrastructure needed by the first test suite may be introduced through a
separate approved task. Phase 8 expands automation breadth, stable fixtures,
selectors, and documented training commands.

## Health Tests

Health tests confirm that the platform starts and basic infrastructure works. Planned bugs must not break health tests.

Current health coverage:

- The health controller returns the exact platform health result.
- The in-memory API health endpoint responds with the expected HTTP contract.

Future health coverage may include:

- Frontend loads.
- Database connection works.
- Seed reset completes.

## Clean Core Tests

Clean core tests verify correct expected store behavior with planned bugs disabled.

Examples:

- Catalog lists available comics correctly.
- Product detail data matches the API.
- Cart totals calculate correctly.
- Checkout creates an order without real payment.
- Role checks protect admin-only pages.

## Bug Verification Tests

Bug verification tests confirm that registered planned bugs behave as intended. They should reference bug registry IDs.

Where possible, they should verify both sides:

- Bug enabled: the planned defect is observable.
- Bug disabled: clean behavior is restored.

## API and Contract Tests

API tests should confirm that backend behavior matches the public training Swagger/OpenAPI surface and the internal developer API contract.

Supertest initializes Nest in memory without binding a fixed application port.
The API suite verifies `GET /health` and the catalog list/detail contract. The
catalog tests run against a migrated, deterministically seeded PostgreSQL
database and remain read-only after fixture preparation. The clean catalog API
matrix also checks published visibility, not-found parity for
draft/archived/unknown slugs, invalid and repeated query values, JSON error
envelopes, and the absence of internal database fields from DTOs.

The first internal contract is `docs/internal/api/catalog.md`. Contract checks
should continue to be added with each supporting feature. The catalog contract
now includes title/SKU search, single-value genre/series/availability filters,
and the localized filter-options response. Public Swagger publication may
follow in Phase 5.

The auth internal contract is `docs/internal/api/auth.md`. The backend auth API
suite covers login, logout, current-user state, invalid credentials parity
across unknown email, wrong password, and disabled account states,
unauthenticated state for missing/malformed/unknown/expired/idle-expired/
revoked sessions, cookie behavior, session timeout behavior, local throttling,
and JSON error envelope consistency. Auth API tests verify that DTOs do not
expose passwords, password hashes, raw session tokens, session hashes, numeric
database IDs, or closed bug guide metadata.

Task `0024` adds DB-backed seed verification for the two enabled demo accounts
and the empty session table. These tests check stable public IDs, normalized
emails, roles, enabled state, Argon2id PHC parameter format, and absence of
plaintext demo passwords. They do not verify login behavior; password
verification is covered by the backend auth API task that approved the
`argon2` dependency.

Task `0031` adds DB-backed seed and persistence verification for cart/order
tables. These checks confirm that deterministic reset starts with no carts,
cart lines, orders, or order lines; that `OrderStatus` contains `PLACED` and
`CANCELLED`; and that the schema installs the key constraints needed by the
clean cart/order contract. They do not verify cart, checkout, CSRF route, or
order-history API behavior; that belongs to later backend implementation tasks.

Task `0032` adds DB-backed API coverage for the implemented CSRF and cart
routes. These tests cover CSRF token issuance, authenticated `USER` access,
`ADMIN` forbidden behavior for buyer routes, guest unauthenticated behavior,
missing/invalid CSRF rejection, empty cart reads without read-side cart
creation, cart add/update/remove behavior, duplicate-line merging, quantity
bounds, product publication and stock checks, localized read DTOs, idempotent
removal, stable JSON error envelopes, and DTO secrecy for password/session
secrets and internal state.

Task `0033` adds DB-backed API coverage for the implemented checkout and
order-history routes. These tests cover checkout success through the clean cart
API, CSRF/auth/role boundaries, empty-cart rejection, address and query
validation, localized order-line snapshots, order number format, stock
decrement, cart clearing, rollback on insufficient stock and non-purchasable
cart lines, user-owned order list/detail behavior, pagination, `ORDER_NOT_FOUND`
privacy, stable JSON error envelopes, and DTO secrecy for password/session
secrets and internal state.

Frontend cart, checkout, and order-history E2E tests remain future work. They
should focus on the browser workflow and avoid duplicating backend API
permutation coverage already owned by Supertest.

## Playwright E2E

Playwright is planned for end-to-end runtime workflows:

- Guest catalog browsing.
- User login.
- Cart and checkout.
- Order history.
- Admin scenarios.
- Selected planned bug discovery paths.

Playwright has two accepted E2E lanes:

- API E2E: use Playwright `request` against the running API server to verify
  that the deployed runtime, cookies, database, and HTTP boundary work together
  for a small number of high-signal paths.
- UI E2E: use Playwright `page` against the running frontend and real API to
  verify user-visible workflows, navigation, accessibility-facing locators, and
  browser session behavior.

Playwright must not duplicate detailed developer-test matrices. Keep schema
edge cases, exhaustive error envelopes, DTO permutations, and service-level
logic in Jest/Supertest/Vitest. Use Playwright for runtime integration and user
journeys that those tests cannot prove.

Frontend testability rules are defined in
`docs/conventions/frontend-testability.md`.

The locator strategy is semantic-first:

- Prefer roles, labels, alternative text, and user-visible contracts.
- Add stable `data-testid` values only when semantic locators are insufficient
  for localized, repeated, or domain-specific identity.
- Never use database IDs, list indexes, styling classes, XPath, deep DOM
  structure, planned bug IDs, or spoiler details as selector contracts.

Loading, empty, error, disabled, and not-found states must be observable without
fixed delays. EN/RU changes must not change automation identity.

The clean Playwright smoke suite is implemented in `e2e/` and runs through
`pnpm test:e2e` against the real frontend, backend, migrated database, and
deterministic clean seed with planned bugs disabled. It uses one Chromium
project and no visual snapshots or axe dependency.

Current catalog smoke coverage includes EN/RU routes, page navigation, detail
navigation, invalid-page canonicalization, search, combined filters,
URL-preserving pagination, clear action, no-results behavior, expected catalog
request parameters, a 390 px viewport overflow check, and one routed API
failure state.

Current auth smoke coverage includes a small Playwright API E2E check for real
login, `/me`, logout, and one invalid-login path, plus UI E2E coverage for
guest catalog access, user login/logout, admin shell role state, generic
invalid-login copy, and localized RU login navigation. It intentionally does
not duplicate the backend Supertest auth matrix or frontend Vitest component
matrix. Phase 8 expands browser coverage, fixtures, scenarios, and CI maturity.

Future write workflows need explicit data isolation or reset behavior.
Authenticated parallel tests should not mutate shared demo-account state
without an approved isolation strategy.

Future cart and checkout Playwright smoke should stay focused on runtime user
journeys: login as the demo user, obtain browser-visible cart state through the
frontend, add a published in-stock comic, change quantity, remove or re-add an
item, complete checkout without payment, and verify the created order appears
in order history. It should not duplicate the detailed Supertest matrix for
CSRF failures, validation permutations, stock conflict branches, DTO field
exclusion, or checkout transaction edge cases.

## Jest and Frontend Tests

The NestJS backend uses Jest 29 with ts-jest 29. Backend unit tests are
colocated under `apps/api/src/**/*.spec.ts`; HTTP API tests are kept under
`apps/api/test/**/*.api-spec.ts` and use a separate Jest configuration.

The React frontend uses Vitest with Testing Library and jsdom. Current coverage
includes localized routing, document language, runtime catalog contracts,
same-origin request construction, cancellation, query identity, observable
route states, the application render-error boundary, catalog page query
canonicalization, catalog cards, detail fields, money formatting, stock states,
and local cover fallback behavior. Component tests mock the existing fetch/query
boundary and do not replace the production data path with a second client.

The clean catalog UI tests also verify stable slug links, EN/RU route behavior,
series versus standalone presentation, creator roles, genres, comparison prices,
and the approved stable test IDs.

Frontend auth unit and component tests cover auth client request construction,
same-origin cookie credentials, current-user guest handling, login form
validation, successful user and admin login, authenticated and unauthenticated
shell state, invalid credentials, logout behavior, and localized route
behavior. They use semantic locators first and stable locale-independent test
IDs only where accessible identity is insufficient. Playwright auth coverage
remains a separate approved task.

Current root commands:

- `pnpm test`: all workspace unit and component tests.
- `pnpm test:web`: frontend unit and component tests.
- `pnpm test:unit:api`: backend unit tests.
- `pnpm test:api`: backend API tests against prepared PostgreSQL.
- `pnpm test:e2e`: clean catalog plus focused auth Playwright smoke suite.

The explicit commands are separate CI gates. CI does not also run aggregate
`pnpm test`, avoiding duplicate frontend/backend unit execution.

## k6 Smoke Tests

k6 is planned for lightweight local performance smoke tests. These tests should check that common local scenarios remain usable under small controlled load.

k6 smoke tests are not production load tests.

## CI Expectations

The current baseline GitHub Actions workflow runs for pull requests and pushes
to `main`. It verifies:

- Frozen dependency installation.
- Frontend and backend type checking.
- Frontend and backend builds.
- Frontend unit and component tests.
- Prisma schema validation.
- Docker Compose configuration validation.
- Backend unit tests.
- PostgreSQL service health.
- Committed migration deployment.
- Deterministic clean catalog seed.
- Backend API and internal catalog contract tests.

The quality workflow uses CI-local demo credentials and one PostgreSQL service.
It prepares the database once, then keeps catalog tests read-only. It does not
use an external or shared database.

Future CI should add separate, clearly named gates for:

- Linting.
- E2E tests.
- Additional contract tests for future API features.
- Performance smoke tests.

CI should make bug mode explicit instead of accidentally running clean core tests against enabled planned bugs.

## Platform Health Rule

Planned bugs must not break platform health. If a planned bug requires degraded behavior, it must be scoped to the educational surface and documented in the bug registry.
