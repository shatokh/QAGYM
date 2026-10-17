# Project Agent Workflow

These procedures were extracted verbatim from the pre-task0037 AGENTS.md. Root governing rules remain in force. Use the existing task format; these references do not grant implementation approval or permission to run a command.

## Current and Future Commands

Available test commands:

- `node scripts/validate-task-governance.mjs`: validate task and progress
  governance metadata without modifying files.
- `node --test tests/task-governance/*.test.mjs`: run governance validator
  fixture tests.
- `node scripts/check-task-closeout.mjs --task <ID>`: run read-only task
  closeout consistency checks before commit or push.
- `node --test tests/task-closeout/*.test.mjs`: run closeout helper fixture
  tests.
- `pnpm test`: run all workspace unit and component tests.
- `pnpm test:web`: run frontend Vitest unit and component tests.
- `pnpm test:unit:api`: run backend Jest unit tests.
- `pnpm test:api`: run backend Jest and Supertest API tests against a migrated,
  deterministically seeded PostgreSQL database.
- `pnpm test:e2e`: run the read-only clean catalog and focused auth Playwright
  smoke suite against the prepared local runtime.

Prepare PostgreSQL with the committed migrations and clean seed before running
`pnpm test:api`. API tests are read-only after preparation.

Frontend markup and tests must follow
`docs/conventions/frontend-testability.md`. Prefer semantic locators and add
stable `data-testid` contracts only where accessible identity is insufficient.

These commands remain placeholders until future implementation tasks define
them:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:k6:smoke`

Do not create or assume placeholder commands until their setup is approved.

## Definition of Ready

A task is ready for review when it includes:

- Title.
- Status.
- Behavior type.
- Priority and Work Origin for task `0019` and later.
- Problem or goal.
- Scope.
- Out of scope.
- Affected docs, API contracts, seed data, tests, and bug registry entries.
- Acceptance criteria.
- Verification plan.
- Risks or open questions.

Before implementation, the task must also preserve an approval record with the
human approval reference and any approved scope notes.

For planned bug tasks, it must also include:

- Bug registry ID.
- Category.
- Difficulty level.
- Flag behavior.
- Closed guide impact.
- Spoiler risk assessment.

## Definition of Done

A task is done when:

- The approved scope is implemented.
- No unrelated changes were added.
- Relevant docs are updated.
- Relevant API contracts or Swagger docs are updated.
- Relevant seed data is updated.
- Relevant tests are added or updated.
- Planned bug registry entries are consistent with implementation.
- Verification commands were run or explicitly documented as not yet available.
- Remaining risks are recorded in the task or progress tracker.

## Testing Taxonomy

Use this taxonomy for future tests:

- Health tests: Confirm the platform starts and basic infrastructure works.
- Clean core behavior tests: Confirm correct expected product behavior.
- Bug verification tests: Confirm registered planned bugs are present when enabled and absent when disabled, where applicable.
- Contract tests: Confirm API behavior matches public and internal API contracts.
- Performance smoke tests: Confirm local demo scenarios remain usable under small controlled load.
