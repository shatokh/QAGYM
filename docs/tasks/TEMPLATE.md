# Task Template

## Status

Draft

Allowed statuses:

- Draft
- Ready for Review
- Approved
- In Progress
- In Review
- Changes Requested
- Done

## Approval Record

- Approved by: Pending.
- Approval reference: Pending.
- Approved scope notes: None.

Do not start implementation while the approval record remains pending.

## Behavior Type

Choose one:

- Clean Feature
- Planned Bug
- Bugfix
- Refactor
- Docs Only
- Infrastructure
- Test Only

Choose the type by primary behavior intent. A Clean Feature may include its
directly supporting schema migration or dependency only when that impact is
explicitly approved. Standalone migration tooling, runtime wiring, and unrelated
dependency work remain Infrastructure.

## Background

Describe the problem, context, or goal. Link related docs, ADRs, roadmap phases, API contracts, seed scenarios, tests, or bug registry entries where relevant.

## Scope

List what this task is allowed to change.

## Out of Scope

List what this task must not change.

## Acceptance Criteria

List observable conditions that make the task complete.

## Verification Plan

List the checks that should be run. If commands do not exist yet, state that clearly.

## Documentation Impact

State which docs need to be created or updated, or write `None`.

## API Contract Impact

State whether public Swagger/OpenAPI or the internal developer API contract must change, or write `None`.

## Seed Data Impact

State whether seed data or demo scenarios must change, or write `None`.

## Test Impact

State which test taxonomy areas are affected:

- Health tests
- Clean core behavior tests
- Bug verification tests
- Contract tests
- Performance smoke tests

Write `None` if the task does not affect tests.

## Bug Registry Impact

For non-planned-bug tasks, write `None` unless registry docs or tooling are affected.

For planned bug tasks, include:

- Bug registry ID.
- Category.
- Difficulty level.
- Clean expected behavior.
- Bugged behavior.
- Flag behavior.
- Affected surfaces.
- Public docs spoiler impact.
- Closed guide impact.
- Verification plan.

## Dependencies

List any new dependencies, tools, or services required. Write `None` if no new dependencies are needed.

## Commit Decision

Record one:

- `Pending human decision`
- `Commit after this task`
- `Group with task <ID>`
- `No commit required`

Codex must ask the human for this decision after the task or implementation step
is complete. Task completion does not authorize a commit automatically.

## Risks and Open Questions

List known risks, tradeoffs, and unresolved decisions.
