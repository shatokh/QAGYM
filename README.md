# QA Comics Gym

QA Comics Gym is a QA training sandbox built around a dummy comics e-commerce store. It is intended for practicing manual testing, API testing, UI testing, automation testing, test case and checklist design, bug hunting, and safe security vulnerability discovery.

The project solves a common training problem: many demo applications are either too clean to test meaningfully or randomly broken in ways that do not teach controlled QA thinking. QA Comics Gym will build a correct clean store first, then introduce planned educational bugs through a controlled bug layer.

## Current Status

The documentation and governance foundation is complete enough to support
document-first implementation. The project is now in Phase 1: Clean Comics
Store Core.

The React, Vite, and TypeScript frontend under `apps/web` now has localized
`/en/...` and `/ru/...` routes, same-origin catalog API access, runtime response
validation, server-state ownership, accessible route states, and Vitest
coverage. The final catalog list and product-detail UI is the next clean
feature task.

The NestJS and TypeScript backend under `apps/api` exposes the platform health
endpoint at `GET /health`. Both workspaces run, typecheck, build, test, and
participate in the repository quality gates.

The first clean product slice is implemented on the backend. PostgreSQL contains
the catalog schema and deterministic EN/RU seed, and the API exposes paginated
published-comic reads at `GET /api/v1/comics` and
`GET /api/v1/comics/:slug`. The behavior is documented in the internal catalog
API contract and covered by separate unit and database-backed API test suites.

Prisma 7 owns the catalog schema, migration, generated API client, and seed
workflow. The local Docker Compose runtime provides PostgreSQL with persistent
storage. Docker Compose is the primary local container runtime for the MVP;
Podman compatibility will be evaluated later through a separate infrastructure
task.

GitHub Actions checks frozen dependency installation, frontend and backend
typechecks and builds, Prisma schema validation, Docker Compose configuration,
frontend and backend unit tests, and database-backed API tests against migrated
and seeded PostgreSQL.

The final frontend catalog experience, auth, cart, checkout, orders, admin
area, public Swagger/OpenAPI, Playwright suite, and controlled planned bug layer
have not been implemented yet.

## Development Workflow

Development is document-first:

1. A meaningful change starts with a written task document.
2. Codex prepares a plan and waits for human approval.
3. Implementation follows the approved task scope.
4. Clean features, planned bugs, bugfixes, refactors, docs-only,
   infrastructure, and test-only tasks are tracked separately.
5. Docs, API contracts, seed data, tests, and the bug registry must stay consistent with the implemented behavior.

See [AGENTS.md](AGENTS.md) and [docs/ways-of-working.md](docs/ways-of-working.md) for the working rules.

See [docs/high-level-plan.md](docs/high-level-plan.md) for the current strategic product plan and open questions.
