# Task 0029: Session Advisor Artifact Implementation

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-08-03: "реалзуй" after
  accepting the three Session Artifact Advisor proposals.
- Approved scope notes: Implement the accepted advisor artifacts for
  Playwright E2E shell fallback guidance, clean-chat handoff generation, and
  task closeout consistency. Do not change product behavior or roadmap task
  `0028`.

The approved decisions and scope are locked for implementation.

## Behavior Type

Infrastructure

This task adds repository-local AI workflow guidance and deterministic helper
tooling. It does not change product behavior.

## Priority

`P2 Normal`

## Work Origin

`Advisor Proposal`

Accepted proposals:

- `saa-agents-playwright-e2e-shell-fallback`
- `saa-skill-clean-chat-handoff`
- `saa-script-task-closeout-consistency`

## Background

The latest session surfaced three durable workflow needs:

- Playwright E2E can pass in the user's local console while hanging in the
  Codex shell/tool pipe, so the repository needs an honest fallback rule for
  verification records.
- Long sessions need a repeatable way to generate a concise new-chat handoff
  prompt from current repository state.
- Task closeout requires several deterministic checks before commit and push,
  beyond the existing governance validator.

Relevant documents:

- `AGENTS.md`
- `docs/ai/session-advisor/proposals/saa-agents-playwright-e2e-shell-fallback.md`
- `docs/ai/session-advisor/proposals/saa-skill-clean-chat-handoff.md`
- `docs/ai/session-advisor/proposals/saa-script-task-closeout-consistency.md`
- `docs/ai/session-advisor/proposals/index.md`

## Unplanned Work Record

None.

## Scope

- Add a concise Playwright E2E shell fallback rule to `AGENTS.md`.
- Add a repository-local `$clean-chat-handoff` skill under
  `.agents/skills/clean-chat-handoff/`.
- Add a dependency-free read-only task closeout consistency script under
  `scripts/`.
- Add focused dependency-free tests for the closeout helper.
- Update `AGENTS.md` with the new skill and command references.
- Update the three accepted proposal files and proposal index to reference this
  implementation task and mark them implemented after verification.
- Update `PROGRESS.md` after implementation.
- Preserve the unrelated untracked task file `docs/tasks/0028-cart-checkout-orders-planning.md`.

## Out of Scope

- Product behavior, frontend, backend, API, database, Prisma, seed data,
  planned bugs, bug registry entries, or local runtime changes.
- Implementing, editing, staging, committing, or reverting
  `docs/tasks/0028-cart-checkout-orders-planning.md`.
- Adding npm/pnpm dependencies.
- Adding Git hooks, CI gates, MCP servers, plugins, or subagents.
- Automatically creating commits from the closeout helper.
- Replacing the existing task governance validator.

## Acceptance Criteria

- `AGENTS.md` documents the Playwright E2E shell fallback rule.
- `$clean-chat-handoff` is discoverable as a repository skill and is explicitly
  invocation-only.
- The clean-chat handoff skill reads bounded repository context and produces a
  copy-ready prompt without implementation, staging, committing, or pushing.
- A read-only closeout helper validates task status, approval, commit decision,
  `PROGRESS.md` placement, accepted proposal ownership, and optional staged
  files.
- Closeout helper tests cover valid and invalid fixtures.
- Advisor proposals are marked `implemented` and reference this task after the
  implementation is verified.
- Existing product behavior and roadmap work remain unchanged.
- `docs/tasks/0028-cart-checkout-orders-planning.md` remains untouched.

## Verification Plan

- Run `node --check scripts/check-task-closeout.mjs`.
- Run `node --test tests/task-closeout/*.test.mjs`.
- Run `node scripts/check-task-closeout.mjs --task 0029`.
- Run `node scripts/validate-task-governance.mjs`.
- Run `git diff --check`.
- Inspect `git status --short` and confirm unrelated `0028` remains unstaged
  and untouched.

## Verification Results

- Passed: `node --check scripts/check-task-closeout.mjs`.
- Passed: `node --test tests/task-closeout/*.test.mjs`.
- Passed: `node scripts/check-task-closeout.mjs --task 0029`.
- Passed: `node scripts/validate-task-governance.mjs`.
- Passed: `git diff --check`.
- Confirmed by `git status --short`: unrelated
  `docs/tasks/0028-cart-checkout-orders-planning.md` remains untracked and
  untouched by this task.

## Documentation Impact

- Update `AGENTS.md`.
- Add `.agents/skills/clean-chat-handoff/SKILL.md`.
- Update advisor proposal files and proposal index.
- Create this task document.

## API Contract Impact

None.

## Seed Data Impact

None.

## Test Impact

Infrastructure tests only:

- Health tests: None.
- Clean core behavior tests: None.
- Bug verification tests: None.
- Contract tests: None.
- Performance smoke tests: None.

## Bug Registry Impact

None.

## Dependencies

None.

Use Node.js standard library only.

## Commit Decision

Commit after this task. The human project owner approved committing and pushing
only task `0029` changes separately on 2026-08-03.

## Risks and Open Questions

- The closeout helper should remain deterministic and avoid semantic judgment
  that belongs in Codex review.
- The handoff skill should not become a second progress tracker; it should read
  existing docs and produce a prompt only.
- The Playwright fallback rule must preserve honesty: human-console results are
  valid evidence, but they must be labeled as such.
