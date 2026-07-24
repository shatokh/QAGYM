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
database and remain read-only after fixture preparation.

The first internal contract is `docs/internal/api/catalog.md`. Contract checks
should continue to be added with each supporting feature. Public Swagger
publication may follow in Phase 5.

## Playwright E2E

Playwright is planned for end-to-end UI workflows:

- Guest catalog browsing.
- User login.
- Cart and checkout.
- Order history.
- Admin scenarios.
- Selected planned bug discovery paths.

Selectors should be stable enough for automation practice.

## Jest and Future Frontend Tests

The NestJS backend uses Jest 29 with ts-jest 29. Backend unit tests are
colocated under `apps/api/src/**/*.spec.ts`; HTTP API tests are kept under
`apps/api/test/**/*.api-spec.ts` and use a separate Jest configuration.

Current root commands:

- `pnpm test`: backend unit tests.
- `pnpm test:api`: backend API tests against prepared PostgreSQL.

The frontend unit test runner remains undecided. Vitest may be evaluated in a
separate approved frontend test task.

## k6 Smoke Tests

k6 is planned for lightweight local performance smoke tests. These tests should check that common local scenarios remain usable under small controlled load.

k6 smoke tests are not production load tests.

## CI Expectations

The current baseline GitHub Actions workflow runs for pull requests and pushes
to `main`. It verifies:

- Frozen dependency installation.
- Frontend and backend type checking.
- Frontend and backend builds.
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
- Frontend unit tests.
- E2E tests.
- Additional contract tests for future API features.
- Performance smoke tests.

CI should make bug mode explicit instead of accidentally running clean core tests against enabled planned bugs.

## Platform Health Rule

Planned bugs must not break platform health. If a planned bug requires degraded behavior, it must be scoped to the educational surface and documented in the bug registry.
