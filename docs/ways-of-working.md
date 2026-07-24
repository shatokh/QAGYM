# Ways of Working

## Process

QA Comics Gym follows a document-first process:

1. Plan.
2. Review.
3. Lock.
4. Implement.
5. Verify.
6. Document.
7. Merge.
8. Track.

## Plan

Every meaningful change starts as a task document in `docs/tasks/`. This includes code, infrastructure, API changes, tests, seed data, and bug registry entries.

Small docs-only clarifications may be made without a task only when the user explicitly requests them.

The task describes the goal, behavior type, scope, out of scope items, acceptance criteria, and verification plan.

Codex should inspect existing docs and code before drafting or changing a task. If the task affects API behavior, seed data, tests, public docs, internal contracts, or planned bugs, that impact must be named in the task.

## Review

The human reviews the task before implementation. Codex may suggest tradeoffs, risks, and missing acceptance criteria, but must not implement until the task is approved.

## Lock

After approval, the task scope is locked. Implementation should follow the approved text. If new information changes the required scope, Codex must stop and propose an amendment.

The approved scope also locks dependencies, architecture assumptions, API contract impact, seed data impact, and bug registry impact. If any of those need to change, use an amendment.

## Implement

Implementation mode is for approved tasks only. Codex should keep changes small and avoid unrelated refactoring.

Clean feature tasks and planned bug tasks must remain separate. A clean feature task should not add intentional defects. A planned bug task should not introduce unrelated product behavior.

Infrastructure work is also implementation work. Package setup, Docker, CI,
standalone migration tooling or operational migrations, runtime configuration,
and dependency changes require approved Infrastructure tasks.

Task type follows the primary intent of the change. A product model and its
directly supporting migration may remain one Clean Feature task when the
migration, dependencies, verification, and documentation impact are explicit in
the approved scope. This does not permit unrelated tooling, runtime, or
refactoring work inside the feature.

New dependencies, tools, services, and runtime requirements must be named in the approved task. Codex should not add hidden dependencies while implementing another task type.

## Verify

Verification should match the task type:

- Docs-only tasks need structure and consistency checks.
- Test-only tasks need the relevant test command.
- Clean features need clean behavior tests where the stack supports them.
- Planned bugs need registry consistency and bug verification tests.
- Bugfixes need regression coverage when practical.

If commands are not available yet, record that clearly instead of inventing commands.

## Document

Docs must stay consistent with behavior. Public docs must not reveal closed bug guide details. API behavior changes must consider public Swagger/OpenAPI and the internal developer API contract.

Seed data is treated as product behavior. If seed data changes, the task should explain why the scenario exists and which docs or tests rely on it.

## Merge

Before merge, confirm that the task reached the Definition of Done and that no unrelated changes were included.

### Commit Checkpoint

Completing a task does not automatically authorize a Git commit. After each
completed task or implementation step, Codex asks the human to choose:

- Commit the verified work now.
- Group it with one or more compatible later tasks.

Codex must not commit until the human makes that decision. Before a commit,
Codex inspects staged files and the staged diff, excludes generated files,
secrets, and unrelated changes, and confirms relevant verification results.

A grouped commit may contain several small related tasks. Clean Feature and
Planned Bug work must not share a commit, and grouping must not make the change
difficult to review. The selected decision should be recorded in the task file
when practical.

## Track

Update `PROGRESS.md` when phase status, active work, blockers, or accepted decisions change. Task documents should remain the detailed source for individual work items.

## How Codex Should Be Used

Codex should operate in three modes:

- Planning mode: gather context, draft or refine a task, and wait for approval.
- Implementation mode: implement an approved task within scope.
- Review mode: inspect changes for bugs, regressions, missing tests, and documentation gaps.

When uncertain, Codex should prefer a small task amendment over a broad unapproved change.

## Task Files

Task files should live in `docs/tasks/`. A practical task file should include:

- Title.
- Status.
- Approval record.
- Behavior type.
- Background.
- Scope.
- Out of scope.
- Acceptance criteria.
- Verification plan.
- Documentation impact.
- Test impact.
- API contract impact.
- Seed data impact.
- Bug registry impact.
- Dependencies.
- Risks and open questions.

Use `docs/tasks/TEMPLATE.md` for new tasks.

Allowed behavior types:

- Clean Feature.
- Planned Bug.
- Bugfix.
- Refactor.
- Docs Only.
- Infrastructure.
- Test Only.

## Planned Bugs vs Real Bugs

A planned bug is an intentional educational defect with a registry entry, ID, category, difficulty, and verification plan.

A real bug is accidental behavior that conflicts with the clean core, platform health, docs, contracts, or a planned bug specification. Real bugs are fixed through bugfix tasks, not added to the planned bug registry as a shortcut.

Planned bugs must not be implemented before the corresponding clean feature
exists and is verified. Initial planned bugs should be flag-controlled and
disabled by default. Always-on bugs or default-on packs require later approval.

## API Contract Changes

Any API behavior change must consider:

- Public training Swagger/OpenAPI.
- Internal developer API contract.
- Contract tests.
- Seed scenarios.
- Public docs spoiler risk.

Intentional public API documentation mismatches are planned bugs and must be tied to bug registry entries.

Internal behavior and API contracts should be created and maintained with the
clean features they specify. The later documentation phase publishes and
consolidates those contracts; it does not replace feature-local contract work.

## Small Reviewable Changes

Tasks should be small enough to review clearly. If a task combines unrelated concerns or becomes too broad during planning, split it before approval.

During implementation, if a small task expands unexpectedly, stop and request an amendment instead of continuing silently.
