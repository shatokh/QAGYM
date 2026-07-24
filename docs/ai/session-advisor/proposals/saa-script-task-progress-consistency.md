# Task and Progress Consistency Validator

## Metadata

- Proposal ID: `saa-script-task-progress-consistency`
- Deduplication key: `deterministic-task-progress-governance-validation`
- Status: `implemented`
- Surface: `script`
- Confidence: `medium`
- Recurrence: Three visible reconciliation points plus a repository-wide
  consistency requirement in the manual bootstrap context.

## Problem

Task status, approval records, commit decisions, roadmap position, and
`PROGRESS.md` are updated manually across each document-first step. The session
included repeated requests to review plans with fresh context and reconcile
documentation before advancing. These checks are predictable, but currently
depend entirely on manual review.

## Proposed Artifact

Create a read-only repository script that validates deterministic governance
invariants, initially:

- every task status and behavior type uses an allowed value;
- tasks beyond `Ready for Review` contain a non-pending approval record;
- completed tasks have a resolved commit decision;
- task IDs and filenames are unique and ordered;
- task references in `PROGRESS.md` point to existing files;
- no task marked active is also listed as done.

The first version should report actionable errors without editing files.
Integration into CI or Git hooks should be a separate later decision based on
false-positive experience.

## Evidence

- `manual-bootstrap-2026-07-24-visible-context`: Degraded bootstrap evidence
  includes separate requests for a fresh roadmap review, full documentation
  reconciliation before the next phase task, and repeated task status and
  commit-decision transitions.
- `human-acceptance-2026-07-24`: The human project owner accepted this
  proposal and requested a governed implementation task.

## Expected Benefit

Catch stale governance metadata before commits, reduce repetitive manual
checking, and prevent the repository plan from diverging from completed work.

## Maintenance Cost

The parser must evolve with Markdown headings and task template changes.
Validation should stay narrow and deterministic to avoid brittle interpretation
of prose.

## Alternatives Considered

An `AGENTS.md` reminder already exists but cannot enforce file invariants. A
hook would enforce too early before the validator has proven reliable. A skill
would add semantic cost to checks that can be deterministic.

## Next Decision

Implemented and verified through
`docs/tasks/0019-next-task-planner-and-governance-validator.md`. Future
validation-rule changes require a separate approved task.
