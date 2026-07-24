# Agent Instructions

## Project Summary

QA Comics Gym is a document-first QA training sandbox based on a dummy comics e-commerce store. The product will help QA engineers practice manual testing, API testing, UI testing, automation, checklist and test case design, bug hunting, and safe security vulnerability discovery.

The core architecture principle is Clean Core + Bug Layer: build correct clean behavior first, then introduce planned educational bugs through a controlled layer.

## Non-Negotiable Rules

- Do not implement code, infrastructure, API changes, tests, seed data, or bug registry entries without an approved task.
- Small docs-only clarifications may be made without a task only when the user explicitly requests them.
- Plan before implementation. If a task is not already Approved, draft or update the task and wait for human approval before implementing.
- After approval, treat task scope as locked. If implementation needs to exceed scope, stop and propose an amendment.
- Do not introduce planned bugs unless explicitly requested.
- Do not mix clean feature work with planned bug work.
- Build and verify clean app behavior before implementing planned bugs.
- Do not add hidden dependencies. New dependencies, tools, services, and runtime requirements must be named in the approved task.
- Do not modify public API behavior without considering docs and API contracts.
- Do not expose closed bug guide details in public docs.
- Treat seed data as product behavior. Seed changes need explicit task scope and reason.
- Do not perform unrelated refactoring.
- Keep changes small and reviewable.
- Do not create commits automatically. After each completed task or
  implementation step, ask the human whether to commit now or group the work
  with a later compatible step.
- If an architecture change is needed, stop and propose an amendment.
- Keep docs, tests, Swagger/API contracts, seed data, and bug registry entries consistent.

## Document-First Workflow

Every meaningful change starts with a task document under `docs/tasks/`. Codex must plan first, then wait for human approval before implementation.

Implementation must follow the approved task scope. If the implementation needs to exceed the approved scope, stop and request an amendment.

## Required Task Lifecycle

Tasks move through these states:

1. Draft
2. Ready for Review
3. Approved
4. In Progress
5. In Review
6. Changes Requested
7. Done

Only tasks in Approved status may be implemented.

## Behavior Types

Each task must identify one behavior type:

- Clean Feature: Implements correct expected product behavior. It may include a
  directly supporting schema migration or dependency only when the approved
  task names that impact explicitly.
- Planned Bug: Introduces a registered educational bug through the controlled bug layer.
- Bugfix: Fixes accidental behavior that is not part of the planned bug registry.
- Refactor: Changes structure without intended behavior change.
- Docs Only: Changes documentation only.
- Infrastructure: Changes setup, tooling, CI, Docker, package management,
  standalone migration tooling or operational migrations, configuration, or
  runtime wiring without introducing product behavior.
- Test Only: Changes tests only.

## Primary Behavior Intent

Classify a task by the primary intent of its observable change.

- A product model and the migration that directly represents it belong to the
  same Clean Feature when both are explicitly approved.
- Standalone migration tooling, database operations, runtime wiring, and
  unrelated dependency work remain Infrastructure.
- A supporting migration or dependency does not authorize unrelated
  infrastructure changes inside a Clean Feature.
- If the primary intent is unclear or the task mixes independent behavior
  types, split the task before approval.

## Planned Bug Rules

- Planned bugs must be registered before implementation.
- Planned bugs need stable IDs.
- Planned bug tasks must reference their registry entry.
- Initial planned bugs should be flag-controlled and disabled by default.
- Planned bug behavior must be distinguishable from clean core behavior.
- Planned bugs must not break platform health.
- Safe security simulations only.
- The initial planned bug metadata minimum is documented in `docs/conventions/bug-registry.md` and must be revisited before the first planned bug implementation.

## API Contract Rules

- Public training Swagger/OpenAPI and internal developer API contracts serve different audiences.
- Internal behavior and API contracts must evolve with the clean features they
  specify; do not defer the first internal contract until the documentation
  publication phase.
- Public API behavior changes must consider public docs, internal contracts, tests, and seed scenarios.
- Intentional public API documentation mismatches are planned bugs and must be registry-driven.

## Change Size Rules

- Keep tasks and diffs small enough to review.
- If a task is too broad, propose a split before implementation.
- Do not combine clean feature work, planned bug work, refactoring, and dependency changes unless the approved task explicitly allows it.

## Commit Checkpoints

- Task completion and Git commit creation are separate decisions.
- After completing and verifying a task or implementation step, Codex must ask
  whether to commit the work now or group it with later work.
- Do not create a commit without explicit human approval.
- Grouped commits may contain multiple completed tasks only when their changes
  are compatible, small, and reviewable.
- Do not group Clean Feature and Planned Bug work in one commit.
- Before committing, inspect staged files and the staged diff, exclude generated
  files and secrets, and run the relevant verification.
- Do not include unrelated user changes in a commit.
- Record the decision in the task file when practical.

## Current and Future Commands

Available test commands:

- `pnpm test`: run backend Jest unit tests.
- `pnpm test:api`: run backend Jest and Supertest API tests against a migrated,
  deterministically seeded PostgreSQL database.

Prepare PostgreSQL with the committed migrations and clean seed before running
`pnpm test:api`. API tests are read-only after preparation.

These commands remain placeholders until future implementation tasks define
them:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:e2e`
- `pnpm test:k6:smoke`

Do not create or assume placeholder commands until their setup is approved.

## Definition of Ready

A task is ready for review when it includes:

- Title.
- Status.
- Behavior type.
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
