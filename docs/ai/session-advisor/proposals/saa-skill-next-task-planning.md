# Document-First Next Task Planner

## Metadata

- Proposal ID: `saa-skill-next-task-planning`
- Deduplication key: `document-first-next-task-selection-and-drafting`
- Status: `implemented`
- Surface: `skill`
- Confidence: `high`
- Recurrence: At least 12 visible task-transition turns in the manual bootstrap
  context.

## Problem

Moving from one completed task to the next repeatedly requires the same semantic
work: reconcile the roadmap, progress tracker, completed task dependencies,
accepted decisions, and commit checkpoint before drafting exactly one next task
for review. Reconstructing this workflow in the main conversation consumes
context and risks skipping a dependency or advancing into implementation before
approval.

## Proposed Artifact

Create a repository-local skill that:

- reads `ROADMAP.md`, `PROGRESS.md`, relevant accepted decisions, and only the
  latest related task files;
- identifies the smallest logical next task and explains dependency ordering;
- checks whether documentation reconciliation is needed first;
- drafts or updates one task in `Ready for Review`;
- stops for human approval and never implements or commits as part of the same
  invocation.

The skill should use `docs/tasks/TEMPLATE.md` and preserve the project's
behavior type, scope lock, approval record, and commit checkpoint rules.

## Evidence

- `manual-bootstrap-2026-07-24-visible-context`: Degraded bootstrap evidence
  shows repeated human requests to continue to the next numbered step, draft
  the next task, review sequencing, and report what follows after a commit.
- `human-acceptance-2026-07-24`: The human project owner accepted this
  proposal and requested a governed implementation task.

## Expected Benefit

Reduce repeated roadmap reconstruction, keep task sequencing consistent, and
make the plan-to-approval boundary explicit across long sessions.

## Maintenance Cost

The skill must track changes to the task template, roadmap structure, progress
format, and governance rules. It should remain repository-local until reuse in
other projects is demonstrated.

## Alternatives Considered

`AGENTS.md` already states the approval policy but is too small a surface for
the multi-document selection workflow. A deterministic script cannot decide
which product slice is logically next without semantic judgment. A subagent is
unnecessary because the relevant context is bounded and the output is one task
proposal.

## Next Decision

Implemented and verified through
`docs/tasks/0019-next-task-planner-and-governance-validator.md`. Future behavior
changes require a separate approved task.
