# Task 0003: Repository Infrastructure Skeleton

## Status

Done

## Behavior Type

Infrastructure

## Background

Task `0002-product-skeleton-planning.md` approved splitting product skeleton work into small implementation tasks. The first implementation task should create only the minimum repository infrastructure needed for later frontend, backend, database, runtime, and CI tasks.

This task starts Phase 1 implementation groundwork without creating application code.

Relevant references:

- `docs/tasks/0002-product-skeleton-planning.md`
- `ROADMAP.md`: Phase 1 - Clean Comics Store Core.
- `docs/architecture.md`: planned monorepo structure.
- `AGENTS.md`: task-first, no hidden dependencies, small reviewable changes.
- `docs/ways-of-working.md`: Infrastructure tasks require approval.

## Scope

Create the minimum monorepo foundation:

- Create root `package.json`.
- Create `pnpm-workspace.yaml`.
- Create empty root workspace folders needed for the planned layout:
  - `apps/`
  - `packages/`
  - `tests/`
- Add minimal tracking files for empty folders only if needed.
- Keep root package metadata minimal and private.
- Add only scripts that are truthful and wired. Do not add fake `lint`, `typecheck`, or `test` scripts if they do not run real checks yet.
- Update docs if the created repository structure differs from current architecture notes.
- Update `PROGRESS.md` after implementation.

## Proposed Minimal Root Package Direction

The future root `package.json` should be intentionally small:

- Mark package as private.
- Use the project name.
- Declare package manager if the pnpm version is known locally or chosen explicitly during implementation.
- Avoid dependencies and devDependencies in this task.
- Avoid scripts that imply checks exist before they are implemented.

Example shape, not final required content:

```json
{
  "name": "qa-comics-gym",
  "private": true,
  "packageManager": "pnpm@<approved-version>"
}
```

If the pnpm version is not clear, either omit `packageManager` or record the chosen version in the implementation notes.

## Proposed Workspace Direction

The future `pnpm-workspace.yaml` should include:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

The `tests/` folder is planned for cross-application tests and does not need to be a pnpm workspace package unless a later task requires it.

## Out of Scope

- Running `pnpm init`, `npm init`, or dependency installation.
- Creating React, Vite, NestJS, Prisma, Docker, CI, or application files.
- Creating `apps/web` or `apps/api`.
- Creating database schema, seed data, migrations, or runtime config.
- Adding dependencies or devDependencies.
- Adding fake scripts for checks that do not exist.
- Adding business logic.
- Adding planned bugs or bug registry entries.

## Acceptance Criteria

- Root `package.json` exists and is minimal.
- `pnpm-workspace.yaml` exists and includes workspace patterns for future apps and packages.
- Root folders for `apps/`, `packages/`, and `tests/` exist.
- No frontend or backend app scaffolding is created.
- No dependencies are installed or declared.
- No Docker, Prisma, CI, or application code is created.
- Documentation remains consistent with the created structure.
- `PROGRESS.md` records completion and any decisions made.

## Verification Plan

- Verify file and folder existence:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `apps/`
  - `packages/`
  - `tests/`
- Verify absent files/folders:
  - `apps/web`
  - `apps/api`
  - `docker-compose.yml`
  - `prisma/schema.prisma`
  - `.github/workflows/`
- Verify `package.json` has no dependencies or devDependencies.
- Verify no install command was run.

## Documentation Impact

May update:

- `PROGRESS.md`
- `docs/architecture.md` only if the created structure differs from current notes.
- `docs/local-development.md` only if there is a useful clarification that commands are still not available.

## API Contract Impact

None.

## Seed Data Impact

None.

## Test Impact

None. This task does not create test commands.

## Bug Registry Impact

None.

## Dependencies

None. This task must not add package dependencies.

## Implementation Notes

- Created minimal root `package.json` with project name and `private: true`.
- Omitted `packageManager` because no pnpm version was explicitly chosen during this task.
- Created `pnpm-workspace.yaml` for future `apps/*` and `packages/*` packages.
- Created `apps/`, `packages/`, and `tests/` roots with non-application `.gitkeep` placeholders.
- Did not install dependencies.
- Did not create frontend, backend, Docker, Prisma, CI, seed, API contract, or planned bug files.

## Risks and Open Questions

- Root `packageManager` can be added later when the pnpm version is intentionally chosen.
