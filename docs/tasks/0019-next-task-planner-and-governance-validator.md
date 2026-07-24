# Task 0019: Next Task Planner and Governance Validator

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24 selecting option 1,
  approve task `0019` as one combined Infrastructure task.
- Approved scope notes: Implement both accepted artifacts with the documented
  priority and urgent unplanned-work rules, grandfather tasks before `0019`
  only for Priority and Work Origin, and keep initial validator enforcement
  manual without CI or Git hooks.
- Amendment approved: Conversation approval on 2026-07-24. Apply schema-era
  validation boundaries: Approval Record is required from task `0010`, Commit
  Decision from task `0006`, and Priority plus Work Origin from task `0019`.
  Earlier tasks remain grandfathered only for fields that did not yet exist.

The approved decisions and scope are locked for implementation.

## Behavior Type

Infrastructure

The task creates repository-local AI workflow guidance, deterministic
governance validation, and supporting documentation. It does not change product
behavior.

## Priority

`P1 High`

This task addresses recurring planning and documentation-consistency friction.
It may run in parallel with the product roadmap only while its changes remain
isolated from product implementation.

## Work Origin

`Advisor Proposal`

Accepted proposals:

- `saa-skill-next-task-planning`
- `saa-script-task-progress-consistency`

## Background

The project repeatedly advances through the same document-first sequence:
reconcile the roadmap and progress tracker, inspect the latest completed work,
select the smallest logical next task, draft it for review, and stop before
implementation. This requires semantic judgment and is a good fit for a
repository-local skill.

Task metadata and `PROGRESS.md` consistency are also checked manually. Allowed
statuses, behavior types, approval records, commit decisions, task references,
and urgent work records are deterministic enough for a read-only validator.

The project also needs an explicit policy for urgent work that was not part of
the roadmap. Urgency must not become a bypass around task-first governance:

- `P0 Critical` and `P1 High` work may receive expedited review.
- Implementation still requires explicit human approval.
- If unapproved changes are already present, Codex must not expand, discard,
  commit, or retroactively label them approved.
- Codex must inventory the existing changes, preserve them untouched, draft an
  Unplanned Work Reconciliation task, and request a human disposition:
  accept for verification, rework, split, or revert.

Relevant documents:

- `AGENTS.md`
- `ROADMAP.md`
- `PROGRESS.md`
- `docs/ways-of-working.md`
- `docs/tasks/TEMPLATE.md`
- `docs/ai/session-advisor/artifact-selection.md`
- `docs/ai/session-advisor/proposal-schema.md`
- `docs/ai/session-advisor/proposals/saa-skill-next-task-planning.md`
- `docs/ai/session-advisor/proposals/saa-script-task-progress-consistency.md`

## Proposed Review Decisions

### 1. Artifact Boundaries

Create two separate artifacts owned by this task:

1. An explicitly invoked repository skill at
   `.agents/skills/next-task-planner/`.
2. A dependency-free, read-only Node.js validator at
   `scripts/validate-task-governance.mjs`.

Recommendation: accept. Semantic next-step selection and deterministic
validation have different responsibilities and should not be combined in one
implementation.

### 2. Priority and Work Origin Metadata

Add these required task metadata fields:

- Priority: `P0 Critical`, `P1 High`, `P2 Normal`, or `P3 Low`.
- Work Origin: `Roadmap`, `Urgent Unplanned`, `Maintenance`, or
  `Advisor Proposal`.

Recommendation: use `P2 Normal` as the template default. Priority controls
review order, not approval requirements. Work Origin explains why the task
exists without overloading Behavior Type.

### 3. Already-Performed Unplanned Work

Add a documented reconciliation path rather than allowing retrospective
approval.

Recommendation: when existing changes cannot be attributed to an approved
task, stop expanding them and create a task that records:

- discovery date and source;
- affected paths;
- known actions already performed;
- reason the normal workflow was missed, if known;
- current verification evidence;
- product, API, seed, test, docs, and bug-registry impact;
- human disposition: accept for verification, rework, split, or revert;
- follow-up actions and commit decision.

No tool may automatically revert or commit those changes.

### 4. Initial Enforcement Level

Recommendation: keep the validator manually invoked in the first version. Do
not add a Git hook or CI quality gate until real repository runs show that the
rules are stable and false positives are low.

### 5. Legacy Task Compatibility

Options:

1. Require Priority and Work Origin only for task `0019` and later.
2. Backfill both fields into every historical task.
3. Backfill only active tasks and the latest completed phase.

Recommendation: option 1. Historical tasks remain subject to their existing
status checks and to the metadata requirements that existed in their schema
era. Approval Record is required from `0010`, Commit Decision from `0006`, and
Priority plus Work Origin from `0019`. This avoids a large docs-only diff,
preserves accepted task history, and gives the validator simple deterministic
boundaries.

## Scope

### Next Task Planner Skill

- Create `.agents/skills/next-task-planner/SKILL.md`.
- Configure the skill for explicit human invocation only.
- Give the skill a bounded read set:
  - `AGENTS.md`;
  - `ROADMAP.md`;
  - `PROGRESS.md`;
  - `docs/tasks/TEMPLATE.md`;
  - the latest directly related task files;
  - accepted ADRs or proposals relevant to the next decision;
  - current `git status` without modifying the worktree.
- Require the skill to identify unresolved `P0 Critical` or `P1 High` work
  before ordinary roadmap work.
- Require the skill to distinguish:
  - the next roadmap task;
  - an urgent new task that still needs approval;
  - already-performed unplanned work that needs reconciliation;
  - a documentation inconsistency that blocks reliable planning.
- Require the skill to explain the recommended ordering and dependencies.
- Allow the skill to draft or update exactly one task in `Ready for Review`.
- Require the skill to stop after planning and wait for explicit approval.
- Prohibit implementation, dependency installation, destructive cleanup,
  staging, and commits from the skill.
- Keep the skill repository-local; do not package it as a plugin.

### Task Governance Validator

- Create `scripts/validate-task-governance.mjs` using the Node.js standard
  library only.
- Make the validator read-only and deterministic.
- Return exit code `0` when validation passes and non-zero when violations are
  found.
- Print concise findings with file paths and violated rules.
- Validate at minimum:
  - numeric task IDs are unique;
  - task filenames and declared task IDs agree;
  - Status values are from the allowed lifecycle;
  - Behavior Type values are allowed;
  - Priority and Work Origin are present and allowed for task `0019` and later;
  - earlier tasks are grandfathered only for Priority and Work Origin;
  - tasks in `Approved`, `In Progress`, `In Review`, `Changes Requested`, or
    `Done` from task `0010` onward have a non-pending approval record;
  - `Done` tasks from task `0006` onward have a resolved Commit Decision;
  - task references in `PROGRESS.md` resolve to existing task files;
  - a task is not simultaneously listed as active and done;
  - `P0 Critical` and `P1 High` tasks are visible in the progress tracker until
    resolved;
  - `Urgent Unplanned` tasks contain an Unplanned Work Record;
  - accepted Session Artifact Advisor proposals reference an implementation
    task or explicitly state that task creation is pending.
- Do not attempt semantic validation of free-form scope or acceptance quality.
- Do not mutate Markdown files or Git state.

### Documentation and Tests

- Create `docs/conventions/task-priority-and-unplanned-work.md`.
- Update `docs/tasks/TEMPLATE.md` with Priority, Work Origin, and an optional
  Unplanned Work Record section.
- Update `AGENTS.md` with concise routing rules for urgent and already-performed
  unplanned work.
- Update `docs/ways-of-working.md` with expedited review and reconciliation.
- Update `PROGRESS.md` with a stable place for unresolved `P0`/`P1` and
  unplanned reconciliation items.
- Update the accepted proposal files to reference this implementation task and,
  after verified completion, mark them `implemented`.
- Add dependency-free Node tests under
  `tests/task-governance/` for valid and invalid fixtures.
- Document manual commands:
  - `node scripts/validate-task-governance.mjs`
  - `node --test tests/task-governance/*.test.mjs`
- Run the validator against the actual repository and reconcile only
  governance issues explicitly included in this task.

## Out of Scope

- Product behavior, frontend, backend, API, database, Prisma, seed data, bug
  registry entries, or planned bugs.
- Changing the Phase 1 product sequence; task `0017` remains the next product
  task.
- Automatic implementation or approval of a drafted task.
- Retrospective claims that unapproved work was approved before it happened.
- Automatic reversion, staging, commit creation, or branch manipulation.
- New npm, pnpm, Python, system, hosted, MCP, or external dependencies.
- Adding the validator to CI, Git hooks, pre-commit hooks, or package scripts.
- A generic project-management system, issue tracker, or priority scheduler.
- Parsing arbitrary prose to infer whether product behavior is correct.
- Modifying completed task history except for narrowly documented
  reconciliation references approved in this task.
- Fixing the Session Artifact Advisor live hook activation issue observed
  during the first manual bootstrap. That requires a separate bugfix task if it
  persists after a new or resumed trusted-project session.

## Acceptance Criteria

- `$next-task-planner` is discoverable and requires explicit invocation.
- The skill reads only the bounded planning context needed for the decision.
- The skill surfaces unresolved `P0`/`P1` or unplanned reconciliation work
  before recommending ordinary roadmap work.
- The skill drafts no more than one `Ready for Review` task and never starts
  implementation or creates a commit.
- Priority and Work Origin values are defined consistently in the template,
  convention, workflow, and validator.
- Tasks before their approved schema-era boundaries remain valid without
  metadata backfill: Approval Record from `0010`, Commit Decision from `0006`,
  and Priority plus Work Origin from `0019`.
- Already-performed unplanned work has a reviewable reconciliation process that
  does not imply retroactive approval.
- The validator is read-only, dependency-free, deterministic, and provides
  actionable file-level errors.
- Validator fixtures cover each required invariant and at least one fully valid
  repository fixture.
- The validator passes against the repository after approved reconciliation.
- Existing product behavior and product roadmap ordering are unchanged.
- Both accepted advisor proposals are marked `implemented` only after all
  task acceptance criteria and verification pass.

## Verification Plan

- Run the repository skill structural validation available at implementation
  time.
- Run:
  `node --check scripts/validate-task-governance.mjs`
- Run:
  `node --test tests/task-governance/*.test.mjs`
- Run:
  `node scripts/validate-task-governance.mjs`
- Exercise `$next-task-planner` against a temporary documentation fixture or
  perform a bounded dry run that cannot implement or commit.
- Verify a normal roadmap case, a pending `P1 High` case, and an
  already-performed unplanned-work case.
- Run `git diff --check`.
- Inspect `git status --short` and confirm no unrelated user changes are staged,
  reverted, or included.

## Verification Results

- `node --check scripts/validate-task-governance.mjs`: passed.
- `node --test tests/task-governance/*.test.mjs`: passed, 15 tests.
- `node scripts/validate-task-governance.mjs`: passed against the repository,
  18 tasks and 2 proposal files.
- The validator fixture suite covers valid schema-era history, read-only
  behavior, IDs, lifecycle values, approvals, commit decisions, priority,
  origin, progress consistency, urgent reconciliation, and accepted proposal
  ownership.
- The system `quick_validate.py` could not start because its Python environment
  does not provide `PyYAML`. No dependency was installed. A dependency-free
  structural fallback passed for required frontmatter, explicit trigger text,
  absence of template TODOs, skill size, default prompt, and
  `allow_implicit_invocation: false`.
- A bounded instruction dry run covered:
  - the current unresolved `P1 High` task, which remains ahead of normal
    roadmap work without creating a duplicate task;
  - a normal roadmap case with no higher-priority work;
  - already-performed unattributed changes, which route to an Unplanned Work
    Reconciliation task without edits, staging, reversion, or commit.
- `git diff --check`: passed after lifecycle documentation updates.
- Existing unrelated follow-up changes to task `0018` documentation were
  preserved and were not staged, reverted, or rewritten by task `0019`.

## Documentation Impact

- Add `docs/conventions/task-priority-and-unplanned-work.md`.
- Update `AGENTS.md`.
- Update `docs/ways-of-working.md`.
- Update `docs/tasks/TEMPLATE.md`.
- Update `PROGRESS.md`.
- Update the two accepted advisor proposal files and proposal index after
  verified implementation.
- Create this task document.

## API Contract Impact

None.

## Seed Data Impact

None.

## Test Impact

Infrastructure tests only. Product test taxonomy is unchanged:

- Health tests: None.
- Clean core behavior tests: None.
- Bug verification tests: None.
- Contract tests: None.
- Performance smoke tests: None.

## Bug Registry Impact

None.

## Dependencies

No new dependencies. Use the existing Node.js runtime and standard library.

## Commit Decision

Commit after this task.

The human project owner approved a separate task `0019` commit on 2026-07-24.
Existing task `0018` follow-up changes must remain outside this commit.

## Risks and Open Questions

- Markdown parsing can become brittle if validation reaches into free-form
  prose. The first version must validate only stable headings and enumerated
  values.
- The schema-era cutoffs are intentionally explicit. Moving one backward later
  would require a separate approved docs task and a bounded metadata backfill.
- A simple `PROGRESS.md` format is preferable to introducing a second
  machine-readable project tracker.
- The first live advisor invocation had an empty event ledger. This task must
  not absorb that separate activation issue.
