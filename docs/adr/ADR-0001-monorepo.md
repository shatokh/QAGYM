# ADR-0001: Monorepo

## Status

Accepted

## Context

QA Comics Gym will include a frontend app, backend app, shared types or utilities, documentation, tests, Prisma assets, and a bug registry. These parts need to evolve together and stay consistent.

The MVP should not start with heavy repository tooling before the structure proves it needs it.

## Decision

Use a monorepo structure. Initially prefer pnpm workspaces and do not use Turborepo or Nx at the start.

## Consequences

- Frontend, backend, docs, tests, Prisma assets, and bug registry can live in one repository.
- Shared code can be introduced only when it removes real duplication.
- The initial setup stays lightweight.
- If build orchestration becomes painful, Turborepo, Nx, or another tool can be proposed through a later ADR amendment.
