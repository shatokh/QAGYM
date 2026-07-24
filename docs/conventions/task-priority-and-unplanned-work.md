# Task Priority and Unplanned Work

## Purpose

Priority controls review order. Work Origin records why a task exists. Neither
field changes the task lifecycle or permits implementation without approval.

The fields are required for task `0019` and later. Earlier tasks remain
grandfathered and must not be given retrospective metadata merely to satisfy
the current template.

## Priority

Use exactly one value:

- `P0 Critical`: Active data loss, credential exposure, destructive repository
  corruption, or another issue requiring work to stop immediately.
- `P1 High`: Important blocker, serious regression, or governance gap that
  should precede normal roadmap work.
- `P2 Normal`: Default planned work.
- `P3 Low`: Useful work that can wait without blocking delivery.

`P0` and `P1` tasks receive expedited planning and review. They still require a
written task, explicit approval, scoped implementation, verification, and a
separate commit decision.

## Work Origin

Use exactly one value:

- `Roadmap`: Work selected from the accepted product or infrastructure roadmap.
- `Urgent Unplanned`: `P0` or `P1` work that was not planned in the current
  roadmap sequence.
- `Maintenance`: Real bugfix, refactor, documentation, or tooling maintenance
  outside the active roadmap slice.
- `Advisor Proposal`: Implementation of an accepted Session Artifact Advisor
  proposal.

Behavior Type still describes what the change does. Work Origin describes why
the task entered the queue.

## Priority Queue

`PROGRESS.md` must keep unresolved `P0 Critical` and `P1 High` tasks visible.
The queue is for ordering, not implementation authorization.

When priorities conflict:

1. Address `P0` before all other work.
2. Address `P1` before ordinary `P2` roadmap work unless the human explicitly
   chooses otherwise.
3. Preserve dependency order when starting a higher-priority task would be
   unsafe or impossible.
4. Record the human sequencing decision in the relevant task or progress
   tracker.

## Unplanned Work Reconciliation

If changes already exist but cannot be attributed to an approved task:

1. Stop expanding the change.
2. Preserve it untouched. Do not stage, commit, revert, or rewrite it.
3. Inventory the affected paths and known actions.
4. Draft an `Urgent Unplanned` task with an Unplanned Work Record.
5. Ask the human to choose one disposition:
   - accept for verification;
   - rework under an approved scope;
   - split into separate tasks;
   - revert through an explicitly approved action.
6. Verify and document the selected disposition before any commit.

This process reconciles repository state; it does not claim that earlier work
was approved retroactively.

## Unplanned Work Record

An `Urgent Unplanned` task must include:

- Discovery date and source.
- Affected paths.
- Known actions already performed.
- Reason the normal workflow was missed, if known.
- Available verification evidence.
- Product, API, seed, test, docs, and bug-registry impact.
- Human disposition.
- Follow-up actions.

Do not include secrets, credential values, or closed bug-guide spoilers in the
record.

## Schema-Era Validation

The governance validator applies fields from the task-schema version in which
they became required:

- Commit Decision: task `0006` and later.
- Approval Record: task `0010` and later.
- Priority and Work Origin: task `0019` and later.

All numbered task files are still checked for a valid ID, filename, Status, and
Behavior Type. These boundaries preserve accepted history without inventing
missing records.
