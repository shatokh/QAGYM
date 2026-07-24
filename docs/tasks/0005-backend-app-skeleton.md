# Task 0005: Backend App Skeleton

## Status

Done

## Behavior Type

Infrastructure

## Background

Tasks `0002-product-skeleton-planning.md` and
`0003-repository-infrastructure-skeleton.md` established the implementation
sequence and pnpm workspace. Task `0004-frontend-app-skeleton.md` added the
frontend workspace. The next step is a minimal NestJS and TypeScript backend
under `apps/api`.

This task should prove that the API can start, typecheck, build, and expose a
stable platform health endpoint. It must not introduce store behavior, database
integration, API documentation tooling, or planned bugs.

Relevant references:

- `docs/tasks/0002-product-skeleton-planning.md`
- `docs/tasks/0004-frontend-app-skeleton.md`
- `PROJECT_BRIEF.md`: backend technology direction.
- `docs/architecture.md`: planned `apps/api` location.
- `docs/testing-strategy.md`: API health endpoint requirement.
- `docs/high-level-plan.md`: proposed backend tools and deferred API docs.
- `AGENTS.md`: task-first, API contract, no hidden dependencies, and scope lock.

## Scope

- Create a pnpm workspace package at `apps/api`.
- Configure a minimal NestJS + TypeScript application.
- Use the standard NestJS Express platform adapter.
- Add an application module and a dedicated health controller.
- Add `GET /health` with this clean response:

  ```json
  {
    "status": "ok"
  }
  ```

- Return HTTP `200` from the health endpoint while the API process is healthy.
- Listen on the numeric `PORT` environment variable when supplied, otherwise
  use port `3000`.
- Keep the health endpoint at `/health`; do not introduce a global `/api`
  prefix or API versioning before product API contracts are designed.
- Enable strict TypeScript settings and the decorator metadata settings required
  by NestJS.
- Add package scripts:
  - `dev`
  - `build`
  - `typecheck`
  - `start`
- Add truthful root scripts for invoking the backend commands.
- Update `pnpm-lock.yaml`.
- Update current status, architecture notes, and local development documentation
  after implementation.

## Proposed File Set

The implementation is expected to create:

- `apps/api/package.json`
- `apps/api/nest-cli.json`
- `apps/api/tsconfig.json`
- `apps/api/tsconfig.build.json`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/health/health.controller.ts`

Equivalent minimal file organization may be used if required by the selected
stable NestJS release. Generated example controllers, services, test files, and
optional tooling must be removed or proposed as an amendment.

## Approved Dependency Boundary

Runtime dependencies:

- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/platform-express`
- `reflect-metadata`
- `rxjs`

Development dependencies:

- `@nestjs/cli`
- `@types/node`
- `typescript`

Exact compatible versions must be selected and recorded in
`apps/api/package.json` and `pnpm-lock.yaml` during implementation. No other
direct dependency may be added without an approved amendment.

## Recommended Setup Decisions

- Use the NestJS Express adapter because it is the standard minimal setup and no
  Fastify requirement exists.
- Keep `/health` outside future product API prefixing and versioning.
- Record Zod as the accepted DTO validation direction, but do not install it
  until a task introduces request DTO validation.
- Do not add Swagger packages until the public/internal API documentation task.
- Do not add Jest, Supertest, or test configuration in this skeleton task.
  Automated health coverage should be introduced by an approved backend test or
  quality-gate task.

## Out of Scope

- Catalog, product, auth, user, cart, checkout, order, or admin endpoints.
- Database access, PostgreSQL, Prisma, schema, migrations, or seed data.
- Request DTOs, response DTO abstractions, or domain models.
- Zod package installation or validation pipes.
- `class-validator` or `class-transformer`.
- Swagger/OpenAPI packages or public/internal API documentation.
- Global API prefixing or API versioning.
- CORS configuration or frontend-to-backend integration.
- Authentication, authorization, roles, sessions, tokens, or cookies.
- Environment configuration libraries or `.env` files.
- Custom logging, tracing, metrics, or production observability.
- Backend unit, integration, API, or contract test setup.
- Jest, Vitest, Supertest, or test coverage tooling.
- ESLint, Prettier, or formatting configuration.
- Docker, PostgreSQL runtime, or deployment files.
- Shared packages or cross-app types.
- Planned bugs or bug registry entries.

## Acceptance Criteria

- `apps/api` is a valid pnpm workspace package.
- The API starts with the documented development command.
- The compiled API starts with the documented production-style command.
- `GET /health` returns HTTP `200` and exactly `{ "status": "ok" }`.
- The default API port is `3000`.
- `PORT` can override the default with a valid numeric port.
- Backend typecheck completes successfully without emitting files.
- Backend production build completes successfully.
- TypeScript strict mode and NestJS decorator metadata are enabled.
- Root scripts, if added, invoke real backend commands.
- `pnpm-lock.yaml` matches all declared dependencies.
- No direct dependency outside the approved boundary is declared.
- No product endpoint, database integration, Swagger setup, automated test
  framework, planned bug, or bug registry entry is introduced.
- Relevant documentation matches the implemented commands and project status.

## Verification Plan

After dependency installation:

- Run the backend typecheck command.
- Run the backend production build command.
- Start the development server and request `GET /health`.
- Verify HTTP `200`, JSON content type, and exact response body.
- Start the compiled application and repeat the health request.
- Start the API with a non-default valid `PORT` and verify the override.
- Verify the manifest contains only approved direct dependencies.
- Verify no out-of-scope product modules, API documentation packages, database
  packages, validation packages, or test packages were added.

No automated backend test command is expected in this task.

## Documentation Impact

Update after implementation:

- `README.md`
- `PROGRESS.md`
- `docs/architecture.md`
- `docs/local-development.md`

## API Contract Impact

This task introduces only the platform health behavior:

- `GET /health`
- HTTP `200`
- JSON body `{ "status": "ok" }`

No public Swagger/OpenAPI or formal internal developer API contract exists yet.
The endpoint must be documented in this task and local development guide, then
included in the internal contract when that artifact is introduced. It must not
be presented as a training API endpoint in public docs during this task.

## Seed Data Impact

None.

## Test Impact

- Health tests: introduces the backend health surface and verifies it through
  direct HTTP checks during implementation.
- Automated health test wiring is deferred to an approved test or quality-gate
  task.
- Clean core behavior tests: none.
- Bug verification tests: none.
- Contract tests: none; no formal contract artifact exists yet.
- Performance smoke tests: none.

## Bug Registry Impact

None.

## Dependencies

This task introduces only the packages listed in the Approved Dependency
Boundary.

Implementation requires:

- Node.js compatible with the selected NestJS, CLI, and TypeScript versions.
- The repository-pinned pnpm version through Corepack.
- Package registry access using valid TLS certificate verification.

## Implementation Notes

- Created the `@qa-comics-gym/api` workspace under `apps/api`.
- Added a minimal NestJS application using the Express platform adapter.
- Added only `AppModule`, `HealthController`, and application bootstrap code.
- Implemented `GET /health` with HTTP `200` and exact body
  `{ "status": "ok" }`.
- Added default port `3000` and numeric `PORT` environment override support.
- Pinned NestJS runtime packages to `11.1.28`, NestJS CLI to `11.0.24`,
  TypeScript to `5.9.3`, and Node.js typings to the Node 22 line.
- Added only the approved direct dependencies.
- Added root commands for backend development, typecheck, build, and compiled
  start.
- Updated `pnpm-lock.yaml`, current status, architecture notes, and local
  development documentation.

Verification completed:

- `corepack pnpm typecheck:api` passed.
- `corepack pnpm build:api` passed.
- The development server started successfully and reported zero TypeScript
  errors.
- Development `GET /health` returned HTTP `200`,
  `application/json; charset=utf-8`, and `{"status":"ok"}`.
- The compiled `dist/main.js` application started successfully and returned the
  same health response.
- A compiled application started with `PORT=3101` and returned the expected
  health response on the overridden port.
- The temporary development and override verification processes were stopped.
- The compiled API remains available on `http://127.0.0.1:3000/health` for
  local review.
- Manifest and lockfile importers contain only the approved direct dependency
  boundary.

## Risks and Open Questions

- NestJS CLI has transitive build dependencies. Only the direct dependencies
  listed above were added to the API manifest.
- The skeleton intentionally has no automated health regression test. This gap
  must be closed before health checks become a CI quality gate.
- Zod remains an accepted architecture direction but is intentionally not a
  dependency until request validation is implemented.
