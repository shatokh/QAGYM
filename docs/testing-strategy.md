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

Examples for future phases:

- API health endpoint responds.
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

Supertest is planned for API behavior tests. Internal contracts should be
created with the APIs they specify, and contract checks should be added as the
supporting test foundation becomes available. Public Swagger publication may
follow in Phase 5.

## Playwright E2E

Playwright is planned for end-to-end UI workflows:

- Guest catalog browsing.
- User login.
- Cart and checkout.
- Order history.
- Admin scenarios.
- Selected planned bug discovery paths.

Selectors should be stable enough for automation practice.

## Vitest or Jest

Vitest or Jest will be used for unit and integration tests depending on the app area and setup decisions. The exact command structure is pending.

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

The baseline workflow does not start PostgreSQL or run product tests. Its
purpose is to catch repository, static typing, build, and configuration
regressions using checks that already exist.

Future CI should add separate, clearly named gates for:

- Linting.
- Unit and integration tests.
- API tests.
- E2E tests.
- Performance smoke tests.

CI should make bug mode explicit instead of accidentally running clean core tests against enabled planned bugs.

## Platform Health Rule

Planned bugs must not break platform health. If a planned bug requires degraded behavior, it must be scoped to the educational surface and documented in the bug registry.
