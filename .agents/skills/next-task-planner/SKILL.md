---
name: next-task-planner
description: Select and draft the next governed QA Comics Gym task from roadmap, progress, priority, and current repository evidence. Use only when the human explicitly invokes $next-task-planner to choose the next roadmap step, surface urgent or unplanned work, reconcile planning blockers, or create one task in Ready for Review. Never implement, stage, commit, install dependencies, or modify product behavior.
---

# Next Task Planner

Choose one reviewable next task without crossing the project's approval gate.

## Gather Bounded Context

1. Read `AGENTS.md`, `ROADMAP.md`, `PROGRESS.md`, and
   `docs/tasks/TEMPLATE.md`.
2. Inspect `git status --short` without changing Git state.
3. Read only:
   - active or latest directly related task files;
   - accepted ADRs needed for the next decision;
   - accepted Session Artifact Advisor proposals that do not yet have an
     implemented artifact.
4. Do not perform a full repository audit unless a visible inconsistency makes
   the next step unsafe to choose.

## Select the Work Track

Evaluate candidates in this order:

1. Unresolved `P0 Critical` work.
2. Unresolved `P1 High` work.
3. Already-performed changes that cannot be attributed to an approved task.
4. Documentation inconsistency that blocks reliable planning.
5. The smallest dependency-ready roadmap task.

Priority changes review order only. It never authorizes implementation.

Classify the recommendation as one of:

- Roadmap: planned product or infrastructure progression.
- Urgent Unplanned: newly identified `P0` or `P1` work outside the roadmap.
- Maintenance: governance, tooling, docs, or real bug maintenance.
- Advisor Proposal: implementation of an accepted advisor proposal.

## Handle Existing Unapproved Changes

When visible changes cannot be attributed to an approved task:

1. Do not expand, edit, revert, stage, or commit them.
2. Inventory affected paths and known actions without exposing secrets.
3. Draft an Unplanned Work Reconciliation task.
4. Require the human to choose: accept for verification, rework, split, or
   revert.
5. Do not describe earlier work as retroactively approved.

Unrelated changes do not automatically block planning. Preserve them and keep
the proposed task scope isolated.

## Draft One Task

Use `docs/tasks/TEMPLATE.md` and:

- choose the next available four-digit task ID;
- set Status to `Ready for Review`;
- set Priority and Work Origin to allowed values;
- preserve a pending Approval Record;
- include dependencies, scope, out of scope, acceptance criteria, verification,
  documentation, API, seed, test, bug-registry, and commit impacts;
- include an Unplanned Work Record when Work Origin is `Urgent Unplanned`;
- explain why this task precedes other candidates;
- draft or update exactly one task file.

If a suitable task already exists, refine that task instead of creating a
duplicate.

## Stop Boundary

After drafting:

- summarize the recommendation and important tradeoffs;
- state any untouched unrelated work;
- ask for human review and approval;
- do not set the task to Approved or In Progress;
- do not implement, install dependencies, modify product files, stage, commit,
  or push.

If architecture or approved scope must change, propose an amendment instead of
drafting broader implementation.
