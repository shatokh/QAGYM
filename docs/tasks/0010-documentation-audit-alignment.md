# Task 0010: Documentation Audit Alignment

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24.
- Approved scope notes: Implement the task as written before catalog foundation
  planning.

## Behavior Type

Docs Only

## Background

After completing the repository, application skeleton, Prisma, local runtime,
and baseline CI tasks, the project documentation was reviewed as one system.
The architecture direction remains coherent, but several documents still
describe the empty-repository state or defer seed data, internal contracts, and
clean behavior tests until phases later than the features that need them.

The audit also identified missing catalog foundation decisions that must be
recorded before the first product model is designed. The human accepted the
audit recommendations:

- Add a minimal clean catalog seed in Phase 1.
- Develop internal API contracts and clean feature tests incrementally with
  product features.
- Keep Phase 5 focused on publishing and consolidating public/internal docs.
- Keep Phase 8 focused on broader automation readiness rather than introducing
  the first product tests.
- Prefer a translation table for RU/EN-ready catalog content.
- Represent money as integer minor units with an ISO currency code.
- Prefer stable local catalog media assets over external runtime dependencies.
- Classify tasks by their primary behavior intent; a Clean Feature may contain
  a directly supporting migration when the task explicitly names it.

This documentation alignment must be completed before the catalog foundation
planning task. The catalog foundation planning task will therefore use ID
`0011`.

Relevant references:

- `PROJECT_BRIEF.md`
- `ROADMAP.md`
- `PROGRESS.md`
- `AGENTS.md`
- `docs/high-level-plan.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/ways-of-working.md`
- `docs/bug-strategy.md`
- `docs/conventions/bug-registry.md`
- `bug-registry/README.md`
- `docs/tasks/TEMPLATE.md`

## Scope

### Current-State Corrections

- Update `PROJECT_BRIEF.md` so it no longer states that application code and
  dependencies do not exist.
- Distinguish completed platform foundation from product behavior that remains
  unimplemented.
- Update references to Docker, PostgreSQL, Prisma, application skeletons, and
  CI so they reflect the repository's actual state.
- Keep `README.md`, `PROGRESS.md`, architecture notes, and local development
  documentation consistent with the corrected brief.

### Roadmap Sequencing

- Clarify that Phase 0 was documentation and governance foundation only.
- Keep Phase 1 focused on the clean catalog and product detail foundation.
- Add a minimal deterministic clean catalog seed to Phase 1.
- Keep user, role, account, and auth-oriented seeded scenarios in Phase 2.
- State that internal API contracts and clean behavior tests are created
  incrementally with the features they specify.
- Reframe Phase 5 as public documentation, Swagger/OpenAPI publication, and
  internal contract consolidation rather than the first appearance of internal
  contracts.
- Reframe Phase 8 as expansion of automation coverage, stable fixtures,
  selectors, and CI commands rather than the first introduction of product
  tests or CI.
- Move the first repeatable seed/reset workflow to the phase that introduces
  seed data. Keep Phase 9 responsible for polish and onboarding validation.

### Catalog Foundation Direction

- Record the accepted direction for RU/EN-ready catalog content:
  normalized translation records rather than fixed language columns or JSONB
  as the default.
- Record the accepted money representation:
  integer minor units plus an ISO currency code.
- Record that display-only discounts may use an optional comparison price but
  do not introduce promocodes or a discount engine.
- Record the local-first media direction:
  stable local cover assets for clean scenarios, a clean missing-image
  fallback, and broken media behavior only through a future registered planned
  bug.
- Identify remaining catalog decisions for task `0011`, including entity
  relationships, IDs and slugs, publication and stock rules, deterministic
  ordering, pagination, search, and filtering.
- Do not design or implement the Prisma schema in this task.

### Governance Clarifications

- Clarify in `AGENTS.md` and `docs/ways-of-working.md` that the primary behavior
  intent determines task type.
- Allow directly supporting migrations and dependency changes inside a Clean
  Feature only when explicitly listed in the approved scope and dependency
  boundary.
- Preserve the rule that unrelated infrastructure and refactoring require
  separate tasks.
- Add a lightweight approval record section to the task template so future
  tasks preserve approval evidence instead of only overwriting status.
- Keep the existing required task lifecycle unchanged.

### Planned Bug Consistency

- Change the strategic planned bug example so initial planned bugs are disabled
  by default.
- Ensure bug registry examples include explicit flag default state.
- Preserve the decision that default-on packs and always-on bugs require later
  approval.
- Keep planned bug implementation out of this task.

### Spoiler Boundary

- Document that an access-controlled in-app bug guide is not secret from people
  who can read repository-backed registry files.
- Add repository visibility and the required spoiler threat model as a pending
  decision before public source publication or a public demo.
- Do not change the accepted repository-backed registry ADR.

### Task Tracking Corrections

- Update task `0008` with its completed commit decision and commit hash
  `21c7cc1`.
- Update task `0009` with its completed commit decision and commit hash
  `f556f95`.
- Record task `0010` as the documentation alignment task.
- Record `0011` as the next proposed catalog foundation planning task.

## Files Expected to Change

- `PROJECT_BRIEF.md`
- `ROADMAP.md`
- `PROGRESS.md`
- `AGENTS.md`
- `docs/high-level-plan.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/ways-of-working.md`
- `docs/bug-strategy.md`, only if spoiler wording needs alignment.
- `docs/conventions/bug-registry.md`, only if flag-default wording needs
  alignment.
- `bug-registry/README.md`
- `docs/tasks/TEMPLATE.md`
- `docs/tasks/0008-local-runtime-wiring.md`
- `docs/tasks/0009-ci-quality-gates.md`
- This task file.

`README.md`, ADRs, and `docs/local-development.md` must be reviewed for
consistency but should not be changed without a concrete mismatch.

## Out of Scope

- Prisma models, generators, migrations, or generated clients.
- Catalog seed implementation or media asset creation.
- Backend database integration.
- API endpoints or API contracts.
- Frontend catalog or product detail UI.
- Test framework or test command setup.
- Package or lockfile changes.
- Docker or CI workflow changes.
- Auth, cart, checkout, orders, or admin behavior.
- Bug registry entries for real planned bugs.
- Planned bug flags or bug layer implementation.
- Changing accepted ADR decisions.
- Selecting repository visibility or a deployment target.

## Acceptance Criteria

- Current-state documentation no longer describes the repository as empty.
- Phase 1 can produce a browsable clean catalog without depending on Phase 2
  seed work.
- Internal contracts and clean feature tests are explicitly incremental from
  Phase 1.
- Phase 5 and Phase 8 retain clear later-stage responsibilities without
  contradicting feature-local contracts and tests.
- Catalog translation, money, discount-display, and local media directions are
  recorded consistently.
- Remaining catalog decisions are clearly deferred to task `0011`.
- Governance permits explicitly scoped supporting migrations in Clean Feature
  tasks without permitting unrelated infrastructure work.
- Initial planned bug examples are flag-controlled and disabled by default.
- Closed guide access wording acknowledges repository spoiler visibility.
- Future task files have a place to preserve approval evidence.
- Completed commit decisions for tasks `0008` and `0009` are accurate.
- No application, package, database, runtime, CI, seed, test, API, or planned
  bug implementation is changed.
- All edited documents remain mutually consistent.

## Verification Plan

- Review the final diff as documentation-only.
- Search active project documentation for stale empty-repository statements.
- Search for roadmap text that defers the first internal contract or clean
  feature tests until Phase 5 or Phase 8.
- Search planned bug examples for a default-enabled initial bug.
- Verify the accepted catalog directions use the same terminology across brief,
  roadmap, progress, architecture, and strategic reference documents.
- Verify `AGENTS.md`, ways of working, and the task template agree on behavior
  type and approval tracking.
- Verify tasks `0008` and `0009` reference their actual commits.
- Run `git diff --check`.
- Verify `git status` contains only the approved documentation files.

No application test command is required because this is a documentation-only
task.

## Documentation Impact

This task is entirely documentation impact. The expected files are listed in
the scope.

## API Contract Impact

No API contract is created or changed. The roadmap will clarify when internal
contracts are introduced.

## Seed Data Impact

No seed data is created or changed. The roadmap will move the minimal clean
catalog seed into Phase 1 planning.

## Test Impact

- Health tests: none.
- Clean core behavior tests: sequencing clarification only.
- Bug verification tests: none.
- Contract tests: sequencing clarification only.
- Performance smoke tests: none.

## Bug Registry Impact

No real registry entry is added. Examples and conventions may be corrected to
show initial flags disabled by default.

## Dependencies

None.

## Commit Decision

Pending human decision.

## Implementation Notes

- Updated the project brief and strategic reference to reflect the implemented
  workspace, application skeleton, Prisma, Docker Compose, and CI foundation.
- Realigned the roadmap so Phase 1 owns the minimum clean catalog seed, internal
  contracts, and relevant clean tests.
- Reframed Phase 5 as documentation publication and contract consolidation.
- Reframed Phase 8 as automation expansion rather than the first test setup.
- Recorded normalized catalog translations, integer minor-unit money, optional
  comparison price, and stable local media as accepted directions.
- Recorded remaining catalog decisions for task `0011`.
- Clarified primary behavior intent and explicitly scoped supporting migrations
  across agent rules, ways of working, and the task template.
- Added an approval record to the task template.
- Corrected initial planned bug examples and rules to default disabled.
- Clarified that in-app guide access control does not hide repository-backed
  spoilers from repository readers.
- Corrected completed commit tracking for tasks `0008` and `0009`.
- Updated README behavior type wording after review found that Infrastructure
  tasks were omitted from its workflow summary.
- Reviewed accepted ADRs and `docs/local-development.md`; no decision or
  current-state mismatch required changes.

Verification completed:

- Active documentation contains no stale empty-repository statement.
- Active documentation contains no obsolete `docker-compose.yml` reference.
- Initial planned bug examples contain no default-enabled flag.
- Phase 1 seed, incremental contract, and clean test sequencing is consistent
  across brief, roadmap, progress, architecture, testing, and strategic docs.
- Catalog translation, money, display-price, and media terminology is
  consistent across active planning documents.
- Governance documents agree on primary behavior intent and approval tracking.
- Tasks `0008` and `0009` reference commits `21c7cc1` and `f556f95`.
- Only documentation files changed.
- `git diff --check` passed.

## Risks and Open Questions

- Broad documentation updates can create unnecessary churn. Files with no real
  mismatch should remain unchanged.
- Historical task scope and implementation notes should not be rewritten;
  only inaccurate tracking metadata should be corrected.
- The exact catalog relationships, identifiers, query behavior, and schema
  remain intentionally open for task `0011`.
- Repository visibility and spoiler secrecy remain pending decisions and do not
  block Phase 1 catalog work.
