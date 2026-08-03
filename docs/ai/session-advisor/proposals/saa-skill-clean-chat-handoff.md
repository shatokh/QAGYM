# Clean Chat Handoff Builder

## Metadata

- Proposal ID: `saa-skill-clean-chat-handoff`
- Deduplication key: `new-chat-project-handoff-prompt-generation`
- Status: `implemented`
- Surface: `skill`
- Confidence: `medium`
- Recurrence: One explicit high-impact handoff request plus repeated long
  session continuation and context recovery needs in the visible context.

## Problem

Long document-first sessions accumulate task state, approval decisions, command
limitations, commit history, and next-step context. Moving to a new chat
requires a precise handoff prompt so the next Codex instance reads the right
documents, does not restart from old assumptions, and respects current
governance.

## Proposed Artifact

Create a repository-local skill that generates a clean-chat handoff prompt. The
skill should read only bounded context:

- `AGENTS.md`;
- `PROGRESS.md`;
- `ROADMAP.md`;
- latest completed task files;
- relevant open task files;
- `git status -sb`;
- latest `git log --oneline` entries.

The output should include what is done, what is not done, what to read first,
known local command limitations, current branch/commit state, and the
recommended next action. It must not implement, stage, commit, push, or update
project docs.

## Evidence

- `manual-bootstrap-2026-08-03-visible-context`: The human explicitly asked for
  a "боевой промпт" to start a clean new chat with done/not-done status,
  first-read list, and continuation guidance.
- `task-0029-verified-2026-08-03`: Implemented through
  `docs/tasks/0029-session-advisor-artifacts-implementation.md`.

## Expected Benefit

Make chat transitions repeatable, reduce context loss, and keep future sessions
aligned with repository governance before they touch files.

## Maintenance Cost

Medium. The skill must track changes to task naming, progress format, and
governance rules. It is still cheaper than recreating a full handoff manually
after every long session.

## Alternatives Considered

`$session-artifact-advisor` can propose durable artifacts, but it is not
specialized for producing a concise next-chat startup prompt. `AGENTS.md`
cannot include live branch, commit, and active-task context.

## Next Decision

Implemented through `docs/tasks/0029-session-advisor-artifacts-implementation.md`.
