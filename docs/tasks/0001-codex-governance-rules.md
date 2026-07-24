# Task 0001: Codex Governance Rules

## Status

Done

## Behavior Type

Docs Only

## Background

QA Comics Gym follows a document-first AI-assisted development process. Before package setup or application code starts, the repository needs clear Codex rules and practical conventions for task scope, behavior types, planned bugs, API contracts, seed data, dependencies, testing taxonomy, and architecture changes.

## Scope

- Update `AGENTS.md` with stricter Codex operating rules.
- Update `docs/ways-of-working.md` with process regulations.
- Add `docs/tasks/TEMPLATE.md`.
- Add `docs/conventions/bug-registry.md`.
- Record that planned bug registry metadata is a starting minimum and must be revisited before the bug layer is implemented.

## Out of Scope

- Application code.
- Package setup.
- Dependency installation.
- Frontend or backend scaffolding.
- Docker, Prisma, database, seed, CI, or test implementation.
- Actual planned bug entries.

## Acceptance Criteria

- Codex rules include task-first, plan-before-implement, scope lock, behavior type, clean app first, planned bug registration, flag-controlled first, public docs spoiler, API contract, seed data as product, test taxonomy, no hidden dependencies, no architecture drift, and small reviewable changes.
- Task behavior types include Clean Feature, Planned Bug, Bugfix, Refactor, Docs Only, Infrastructure, and Test Only.
- A reusable task template exists under `docs/tasks/`.
- A bug registry convention exists under `docs/conventions/`.
- No application setup files are created.

## Verification Plan

- Verify the expected documentation files exist.
- Search for unintended setup files such as `package.json`, `docker-compose.yml`, or `schema.prisma`.
- Confirm no application code was created.

## Documentation Impact

Updates project governance and task documentation.

## Test Impact

No tests are added. Test taxonomy rules are documented only.

## API Contract Impact

No API contract is created. API contract change rules are documented only.

## Seed Data Impact

No seed data is created. Seed data governance rules are documented only.

## Bug Registry Impact

No planned bug entries are created. Planned bug registry rules are documented only.

## Risks and Open Questions

- The planned bug metadata minimum may need to change when actual bug layer implementation starts.
- Additional conventions for branching, commits, API contracts, and testing taxonomy may be useful later.
