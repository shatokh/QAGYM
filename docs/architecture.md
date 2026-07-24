# Architecture Notes

The initial frontend and backend application skeletons now exist. This document
records the current structure and the intended next architecture steps.

## Monorepo Structure

The project uses a lightweight monorepo:

```text
apps/
  web/                 # React/Vite skeleton exists
  api/                 # NestJS skeleton exists
packages/
  shared/              # planned when justified
docs/
bug-registry/
tests/
prisma/                # planned
```

Repository areas:

- `apps/web`: React, Vite, and TypeScript frontend.
- `apps/api`: NestJS, Express, and TypeScript backend.
- `packages/shared`: Shared types or utilities when they remove duplication.
- `docs`: Project docs, ADRs, and task files.
- `bug-registry`: Repository-backed planned bug definitions.
- `tests`: Cross-application test assets when needed.
- `prisma`: Prisma schema, migrations, and seed data after approved implementation tasks.

## Clean Core + Bug Layer

The clean core is the correct comics store behavior. It should be implemented first and covered by tests.

The bug layer is the controlled mechanism for planned educational bugs. Planned bugs should be enabled through explicit configuration, flags, or scenario controls rather than random defects.

Clean core code and bug layer behavior should be easy to reason about separately.

## Bug Flags

Planned bugs should support environment or configuration-based flags where practical. The exact flag model is pending. The intended properties are:

- Predictable local behavior.
- Easy enable and disable paths.
- Clear mapping to bug registry IDs.
- No platform health regressions.

## API Documentation Separation

The project will keep two API documentation audiences:

- Public training API docs: Swagger/OpenAPI exposed for QA practice.
- Internal developer API contract: implementation-facing behavior, validation, errors, and versioning notes.

Public training docs must not leak closed bug guide details.

## Current Platform Health Contract

The backend skeleton exposes:

- `GET /health`
- HTTP `200`
- JSON response `{ "status": "ok" }`

This endpoint is platform infrastructure, not a training API exercise. It should
remain outside future product API prefixes and must stay healthy when planned
bugs are introduced.

## Local-First Runtime

The future local runtime should use Docker Compose for PostgreSQL and supporting
services that are approved for MVP. The frontend and backend are currently
runnable directly through documented pnpm commands.

Docker, PostgreSQL, Prisma, migrations, and seed data remain future approved
task scope.
