# Playwright E2E Shell Fallback Rule

## Metadata

- Proposal ID: `saa-agents-playwright-e2e-shell-fallback`
- Deduplication key: `playwright-e2e-codex-shell-hang-fallback-and-verification-record`
- Status: `implemented`
- Surface: `AGENTS.md`
- Confidence: `high`
- Recurrence: Multiple visible E2E verification attempts in the 2026-08-03
  manual bootstrap context.

## Problem

Playwright E2E commands repeatedly completed or produced useful output in the
user's console but hung or were interrupted in the Codex shell/tool pipe. The
session spent material time retrying equivalent E2E runs, debugging process
cleanup, and reconciling human-local verification with Codex-local command
behavior.

## Proposed Artifact

Add a short repository-wide rule to `AGENTS.md` for Playwright E2E verification:

- use bounded Codex tool runs for syntax, runner failure paths, and lightweight
  checks;
- if Playwright hangs in the Codex shell after the user can reproduce a clean
  local console result, stop retrying the same command;
- record the exact human-run command, result, and limitation in the task
  verification notes;
- avoid marking a result as Codex-verified when it was human-console verified.

## Evidence

- `manual-bootstrap-2026-08-03-visible-context`: Targeted auth Playwright specs
  reached green output in earlier Codex attempts but the shell process hung;
  the user reported the same tests completed locally in about 11 seconds and
  asked not to keep retrying through the unstable channel.
- `task-0029-verified-2026-08-03`: Implemented through
  `docs/tasks/0029-session-advisor-artifacts-implementation.md`.

## Expected Benefit

Reduce wasted verification loops, keep task records honest, and prevent Codex
from treating tool-pipe instability as product failure.

## Maintenance Cost

Low. This is a short operational convention. It should be revisited only if the
Codex shell environment becomes reliable for Playwright on this repository.

## Alternatives Considered

A script-level fix was attempted through `scripts/run-playwright-e2e.mjs`, but
the observed issue also involved the tool pipe environment. A hook would be too
heavy because the decision requires visible command behavior and human context.

## Next Decision

Implemented through `docs/tasks/0029-session-advisor-artifacts-implementation.md`.
