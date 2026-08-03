---
name: clean-chat-handoff
description: Build a concise copy-ready prompt for starting a fresh Codex chat in QA Comics Gym, using bounded repository state, recent commits, progress, roadmap, and latest task context. Use only when the human explicitly invokes $clean-chat-handoff or asks to move to a clean/new chat with a project handoff. Never implement, edit files, stage, commit, push, or mark tasks complete.
---

# Clean Chat Handoff

Generate a practical startup prompt for a new Codex chat. Keep the output
copy-ready and grounded in current repository evidence.

## Gather Bounded Context

Read only:

1. `AGENTS.md`
2. `PROGRESS.md`
3. `ROADMAP.md`
4. `docs/ways-of-working.md`
5. `docs/testing-strategy.md`
6. `docs/local-runbook.md`
7. `docs/tasks/TEMPLATE.md`
8. The active task file if `PROGRESS.md` names one.
9. The latest completed task files needed to explain current state.
10. `git status -sb`.
11. Up to the latest 10 commits through `git log --oneline -10`.

Do not perform a full repository audit unless the visible state is
contradictory enough that a safe handoff cannot be written.

## Handle Dirty Worktrees

If `git status -sb` shows changes:

- identify tracked and untracked paths at a high level;
- state whether they appear related to an active task when the docs make that
  clear;
- do not stage, revert, edit, commit, or push anything;
- include a clear instruction for the next chat to inspect those changes before
  implementation.

## Include Required Handoff Content

The prompt must include:

- repository path;
- project summary and Clean Core + Bug Layer principle;
- strict governance reminders from `AGENTS.md`;
- first files to read;
- what is already done;
- what is not done or still pending;
- active task or next likely task;
- local command caveats, especially Playwright E2E shell fallback behavior if
  relevant;
- latest commit and branch state;
- a clear first action sequence for the new chat.

## Output Format

Return:

1. A one-paragraph status summary for the current human.
2. One fenced `text` block containing the complete handoff prompt.

Keep the prompt direct and usable. Do not include raw secret values, captured
session logs, hidden reasoning, or unrelated file contents.

## Stop Boundary

After producing the prompt:

- stop;
- do not draft a task unless the human separately asks;
- do not implement;
- do not stage, commit, or push.
