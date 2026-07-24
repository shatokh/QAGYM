# Task 0006: Git Repository Baseline

## Status

Done

## Behavior Type

Infrastructure

## Background

The repository foundation, frontend skeleton, and backend skeleton were created
before Git was initialized. The user explicitly approved a temporary deviation
from the product skeleton sequence to establish version control and create the
first baseline commit.

The user also requested an explicit commit checkpoint after each future
completed task or implementation step. A commit may be created immediately or
several compatible steps may be grouped after human approval.

Relevant references:

- `AGENTS.md`
- `docs/ways-of-working.md`
- `docs/tasks/0002-product-skeleton-planning.md`
- `PROGRESS.md`

## Scope

- Initialize a Git repository with `main` as the initial branch.
- Include the current documentation, governance, workspace configuration,
  frontend skeleton, backend skeleton, and lockfile in the baseline commit.
- Verify generated dependencies, build output, local environment files, and
  machine-specific files are ignored.
- Add governance rules requiring Codex to ask for a commit decision after each
  future completed task or implementation step.
- Allow the user to choose between:
  - Commit the completed work now.
  - Group it with one or more compatible later tasks.
- Add commit decision tracking to the task template.
- Amend the remaining product skeleton task numbering after inserting this task.
- Update `PROGRESS.md`.
- Create the first commit with a message that describes the combined project
  foundation.

## Out of Scope

- Creating a remote repository.
- Connecting to GitHub or another Git host.
- Pushing commits.
- Creating pull requests.
- Defining a long-term branch strategy.
- Adding Git hooks, commit linting, release tooling, or CI.
- Rewriting or squashing history.
- Changing application behavior, dependencies, API behavior, or seed data.

## Acceptance Criteria

- The repository is initialized on branch `main`.
- The first commit contains all intended project foundation files.
- `node_modules`, `dist`, environment files, logs, and machine artifacts are not
  tracked.
- No secret or machine-specific CA file is committed.
- The working tree is clean after the baseline commit.
- `AGENTS.md` and `docs/ways-of-working.md` require an explicit human commit
  decision after future completed work.
- `docs/tasks/TEMPLATE.md` includes a commit decision section.
- The remaining database, runtime, and CI skeleton tasks are renumbered without
  ambiguity.
- `PROGRESS.md` records the Git baseline decision and completion.

## Verification Plan

- Run `git status --short` before staging and inspect all files.
- Inspect ignored generated paths.
- Stage the intended baseline files.
- Review `git diff --cached --stat` and staged file names.
- Create the baseline commit.
- Verify the current branch is `main`.
- Verify `git log -1` shows the baseline commit.
- Verify `git status --short` is empty after commit.

## Documentation Impact

Update:

- `AGENTS.md`
- `docs/ways-of-working.md`
- `docs/tasks/TEMPLATE.md`
- `docs/tasks/0002-product-skeleton-planning.md`
- `PROGRESS.md`

Create this task file.

## API Contract Impact

None.

## Seed Data Impact

None.

## Test Impact

None. Existing frontend and backend verification results remain unchanged.

## Bug Registry Impact

None.

## Dependencies

- Git, already available in the local environment.
- Existing global Git author identity.

No project package dependency is added.

## Commit Decision

Commit after this task. The user explicitly requested the first baseline commit.

For future tasks, record one of:

- `Pending human decision`
- `Commit after this task`
- `Group with task <ID>`
- `No commit required`

## Implementation Notes

- Initialized the repository with `main` as the initial branch.
- Used the existing global Git author identity.
- Added `.gitattributes` to normalize repository text files to LF.
- Confirmed `.gitignore` excludes nested `node_modules`, application `dist`
  output, environment files, logs, and common machine artifacts.
- Added `.gitkeep` files so all planned empty bug registry category directories
  survive clone and checkout.
- Confirmed no environment, certificate, key, or local CA file is staged.
- Inspected all staged paths, staged statistics, and whitespace checks before
  commit.
- Re-ran frontend and backend typechecks and builds successfully.
- Confirmed the compiled API health endpoint still returns HTTP `200` with
  `{"status":"ok"}`.
- Prepared the first commit as `chore: establish project foundation`.

## Risks and Open Questions

- The first commit intentionally groups the completed documentation foundation,
  repository setup, frontend skeleton, and backend skeleton because Git was not
  initialized earlier.
- No remote or backup is created by this task.
