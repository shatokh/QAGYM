# Task Closeout Consistency Helper

## Metadata

- Proposal ID: `saa-script-task-closeout-consistency`
- Deduplication key: `task-close-progress-commit-decision-finalization`
- Status: `implemented`
- Surface: `script`
- Confidence: `medium`
- Recurrence: Multiple visible task closeout, commit, amend, and progress
  synchronization turns across the manual bootstrap context.

## Problem

Closing a task requires several small but easy-to-miss updates: task status,
commit decision wording, `PROGRESS.md` active/done placement, verification
notes, staged-file scope, and post-commit/push status. In the visible session,
the governance validator caught an unresolved `Commit Decision` after `0027`
was moved to `Done`, requiring an extra correction and amend workflow.

## Proposed Artifact

Create a deterministic helper script that audits a task closeout before commit.
The first version should be read-only and report:

- task status and resolved approval record;
- whether `Commit Decision` matches validator expectations;
- whether `PROGRESS.md` has the task in exactly one of active or done;
- whether the staged files match the task ID and expected scope;
- suggested safe next command sequence for commit and push.

It should not edit files initially. If the read-only version proves useful, a
later task may add an explicit `--write` mode for mechanical status updates.

## Evidence

- `manual-bootstrap-2026-08-03-visible-context`: The task `0027` closeout needed
  status/progress updates, governance validation, staging inspection, commit,
  amend, push, and final clean-tree verification.
- `task-0029-verified-2026-08-03`: Implemented through
  `docs/tasks/0029-session-advisor-artifacts-implementation.md`.

## Expected Benefit

Reduce closeout mistakes, prevent avoidable amend commits, and make the
document-first lifecycle easier to repeat without weakening review discipline.

## Maintenance Cost

Medium. The script must stay aligned with `docs/tasks/TEMPLATE.md`,
`PROGRESS.md`, and `scripts/validate-task-governance.mjs`.

## Alternatives Considered

The existing governance validator catches some invariant violations but does
not guide the closeout sequence, inspect staged scope by task, or summarize the
safe commit/push path. A broad AGENTS rule already exists but cannot automate
deterministic checks.

## Next Decision

Implemented through `docs/tasks/0029-session-advisor-artifacts-implementation.md`.
