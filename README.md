# QA Comics Gym

QA Comics Gym is a QA training sandbox built around a dummy comics e-commerce store. It is intended for practicing manual testing, API testing, UI testing, automation testing, test case and checklist design, bug hunting, and safe security vulnerability discovery.

The project solves a common training problem: many demo applications are either too clean to test meaningfully or randomly broken in ways that do not teach controlled QA thinking. QA Comics Gym will build a correct clean store first, then introduce planned educational bugs through a controlled bug layer.

## Current Status

The documentation and governance foundation is complete enough to support
document-first implementation. The project is now in Phase 1: Clean Comics
Store Core.

A minimal React, Vite, and TypeScript frontend skeleton exists under `apps/web`.
A minimal NestJS and TypeScript backend skeleton exists under `apps/api` and
exposes the platform health endpoint at `GET /health`. Both workspaces can run,
typecheck, and build, but they do not contain store features or business logic
yet.

The local Docker Compose runtime provides PostgreSQL for future product work.
The product database schema, seed data, formal API contracts, automated tests,
and planned bug layer have not been created yet.

A Prisma 7 PostgreSQL configuration skeleton now exists at the repository root.
It contains no product models, generated client, migrations, seed data, or
database connection from the API.

Docker Compose is the primary local container runtime for the MVP. Podman
compatibility will be evaluated later through a separate infrastructure task.

A minimal GitHub Actions quality workflow now checks frozen dependency
installation, frontend and backend typechecks and builds, Prisma schema
validation, and Docker Compose configuration. Linting and automated product
tests remain future tasks.

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
