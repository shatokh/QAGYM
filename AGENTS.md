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

## Priority and Unplanned Work

- Tasks `0019` and later must declare Priority and Work Origin using
  `docs/conventions/task-priority-and-unplanned-work.md`.
- `P0 Critical` and `P1 High` change review order but never bypass task
  approval.
- If existing changes cannot be attributed to an approved task, do not expand,
  revert, stage, or commit them. Preserve them, inventory affected paths, and
  draft an Unplanned Work Reconciliation task for human disposition.
- Do not describe already-performed work as retroactively approved.
- Run `node scripts/validate-task-governance.mjs` after governance task or
  progress changes.

## Next Task Planner

- Run `$next-task-planner` only when the human explicitly invokes it.
- The skill may inspect bounded planning context and draft or update exactly
  one task in `Ready for Review`.
- The skill must stop for human approval and may not implement, install
  dependencies, stage, commit, or push.

## Clean Chat Handoff

- Run `$clean-chat-handoff` only when the human explicitly asks to move to a
  new chat or create a handoff prompt.
- The skill may read bounded repository context, current Git status, latest
  task files, and recent commits to produce one copy-ready startup prompt.
- The skill must not implement, edit files, install dependencies, stage,
  commit, push, or mark tasks complete.

## Session Artifact Advisor

- Run the repository `$session-artifact-advisor` skill only when the human
  explicitly invokes it.
- An explicit advisor run may update local `.session-advisor/` state and
  proposal files, including the proposal index, under
  `docs/ai/session-advisor/proposals/` without a separate task.
- The advisor may propose artifacts but must not implement them without the
  normal approved-task workflow.

## Playwright E2E Verification

- Prefer bounded Codex tool runs for Playwright syntax checks, runner failure
  paths, and ordinary E2E verification.
- If a Playwright command repeatedly hangs in the Codex shell/tool pipe while
  the human can run the same command successfully in a local console, stop
  retrying the same E2E command through Codex.
- Record the exact human-run command, result, and limitation in the task
  verification notes.
- Do not describe a human-console Playwright result as Codex-verified.

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

## Procedures and Verification

- Follow [project procedures](docs/ai/project-agent-workflow.md) for the command catalog, Definition of Ready/Done, and testing taxonomy.
- Before implementation, preserve the human approval reference and approved scope notes in the task.
- Prepare PostgreSQL with committed migrations and clean seed before API tests; those tests are read-only after preparation.
- Frontend markup and tests follow `docs/conventions/frontend-testability.md`: prefer semantic locators; add stable `data-testid` only when accessible identity is insufficient.
- Do not create or assume placeholder commands until their setup is approved.

## Native Triumvirate

- PRIMARY ONLY: saved teamMode is triumvirate. For change tasks, read [the team procedure](.agents/skills/triumvirate/SKILL.md) and [pilot guidance](docs/ai/triumvirate-pilot.md). This authorizes native delegation only within the human-approved task scope; existing approval gates remain in force.
- The primary plans and coordinates; assigned implementers edit product files. Pass effectiveTeamMode and phase to delegates; they follow their assigned role/phase and never start another team. Use one native runtime for the whole team.
- Use fresh auditors for plan review, implementation review and independent verification. Plan/code auditors do not execute project code; verification never fixes product files and requires a supplied suitable isolated environment.
- Confirm actual GPT-6.1 Sol/high and role identities; config alone is insufficient. Missing capabilities/isolation block the affected phase; do not silently fall back.
