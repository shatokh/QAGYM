# Task 0009: CI Quality Gates

## Status

Done

## Behavior Type

Infrastructure

## Background

The repository now has installable frontend and backend workspaces, committed
dependency locks, typecheck and build commands, Prisma schema validation, and a
Docker Compose configuration. These checks are currently manual.

The next infrastructure step is a minimal GitHub Actions workflow that runs only
checks which already exist and provide useful failure signals. This task must
not invent placeholder lint or test commands, add test frameworks, or expand
into deployment automation.

Relevant references:

- `docs/tasks/0002-product-skeleton-planning.md`
- `docs/tasks/0008-local-runtime-wiring.md`
- `docs/testing-strategy.md`
- `docs/ways-of-working.md`
- `AGENTS.md`: no hidden dependencies, small reviewable changes, and test
  taxonomy rules.

## Scope

- Add `.github/workflows/quality.yml`.
- Run the workflow for:
  - Pull requests.
  - Pushes to `main`.
- Use one Linux job with a stable job ID suitable for future branch protection.
- Grant only read access to repository contents.
- Prevent obsolete runs for the same branch or pull request from consuming
  runner time through workflow concurrency.
- Use the repository's pinned Node.js and pnpm versions:
  - Node.js `22.13.0`.
  - pnpm `11.17.0` from the root `packageManager` field.
- Use these reviewed action releases:
  - `actions/checkout` `v6.0.2`.
  - `pnpm/action-setup` `v6.0.8`.
  - `actions/setup-node` `v6.4.0`.
- Pin every referenced action to a verified immutable release commit SHA and
  include release tag comments for maintainability.
- Cache the pnpm store through one setup action only.
- Install dependencies with the frozen lockfile.
- Run only existing repository checks:
  - Frontend typecheck.
  - Backend typecheck.
  - Frontend build.
  - Backend build.
  - Prisma schema validation.
  - Docker Compose configuration validation.
- Provide the non-secret local demo `DATABASE_URL` needed by Prisma validation.
- Use `.env.example` for Compose interpolation.
- Update CI expectations and current project status after implementation.

## Proposed Workflow Shape

The workflow should contain one job named `quality` on `ubuntu-24.04`.

Recommended step order:

1. Check out the repository.
2. Install pnpm from the root `packageManager` field and enable the pnpm store
   cache through `pnpm/action-setup`.
3. Configure Node.js `22.13.0`.
4. Run `pnpm install --frozen-lockfile`.
5. Run frontend and backend typechecks.
6. Run frontend and backend builds.
7. Run Prisma schema validation with the local demo `DATABASE_URL`.
8. Run `docker compose --env-file .env.example config`.

Do not also enable the `actions/setup-node` pnpm cache.

Equivalent command grouping is acceptable only if each failed check remains
easy to identify in the workflow log.

## Recommended Decisions

- Use GitHub Actions because the repository is already Git-based and the
  project expects GitHub-style review and CI workflows.
- Use `ubuntu-24.04` rather than the moving `ubuntu-latest` label so the runner
  environment changes intentionally.
- Keep one job initially to avoid repeated dependency installation and
  unnecessary matrix complexity.
- Use explicit action release SHAs to reduce action supply-chain drift.
- Keep the workflow free of secrets and write permissions.
- Validate Compose configuration without starting PostgreSQL. Runtime health was
  verified in task `0008`; automated database startup should be introduced when
  database integration tests require it.
- Do not add aggregate `lint`, `test`, or `ci` scripts until their real command
  structure is approved.
- Do not add path filters. Documentation-only pull requests should still verify
  that the repository remains installable and the committed configuration is
  valid.

## Out of Scope

- ESLint, Prettier, or another lint/format tool.
- Unit, integration, API, E2E, contract, or k6 tests.
- Vitest, Jest, Supertest, Playwright, or k6 setup.
- PostgreSQL container startup in CI.
- Database connectivity checks, migrations, models, or seed data.
- Prisma Client generation.
- Root aggregate `lint`, `test`, or `ci` scripts.
- Test coverage collection or thresholds.
- Build artifact upload.
- Matrix testing across Node.js, operating systems, or package manager versions.
- Docker image builds or registry publishing.
- Deployment workflows.
- GitHub branch protection or repository settings.
- Dependabot or Renovate configuration.
- Status badges.
- API behavior or API contract changes.
- Planned bugs or bug registry entries.

## Acceptance Criteria

- `.github/workflows/quality.yml` is valid GitHub Actions YAML.
- The workflow runs on pull requests and pushes to `main`.
- The workflow has one stable `quality` job on `ubuntu-24.04`.
- Workflow permissions are read-only.
- Concurrency cancels obsolete runs for the same branch or pull request.
- Node.js and pnpm versions match repository decisions.
- Referenced actions are supported releases pinned to verified immutable commit
  SHAs.
- Exactly one pnpm store cache mechanism is configured.
- Dependency installation uses `pnpm install --frozen-lockfile`.
- Existing frontend and backend typechecks pass in CI.
- Existing frontend and backend builds pass in CI.
- Prisma schema validation passes with a non-secret local demo URL.
- `docker compose --env-file .env.example config` passes.
- No PostgreSQL container or additional service is started.
- No lint command, test framework, test command, deployment behavior, or
  package dependency is introduced.
- Documentation states exactly which quality gates exist and which are still
  deferred.
- The workflow is either verified by a GitHub Actions run or explicitly marked
  as locally validated but remotely unverified when no remote repository is
  available.

## Verification Plan

- Review the workflow triggers, permissions, concurrency, runner, and action
  pins.
- Parse the workflow YAML with an available non-project parser if possible.
- Run `corepack pnpm install --frozen-lockfile`.
- Run `corepack pnpm typecheck:web`.
- Run `corepack pnpm typecheck:api`.
- Run `corepack pnpm build:web`.
- Run `corepack pnpm build:api`.
- Run `corepack pnpm db:validate` with the local demo `DATABASE_URL`.
- Run `docker compose --env-file .env.example config`.
- Verify the workflow contains no secret references or write permissions.
- Verify no package manifest or lockfile dependency changes were introduced.
- If a GitHub remote is configured and pushing is separately approved, inspect
  the first workflow run.

Remote execution is not required to implement the workflow when no GitHub
remote is available. Local verification must not be represented as a successful
GitHub Actions run.

## Documentation Impact

Update after implementation:

- `README.md`
- `PROGRESS.md`
- `docs/testing-strategy.md`

## API Contract Impact

None.

## Seed Data Impact

None.

## Test Impact

- Health tests: no automated health test is added.
- Clean core behavior tests: none.
- Bug verification tests: none.
- Contract tests: none.
- Performance smoke tests: none.

This task automates existing static and build checks. It does not add product
tests or change the testing taxonomy.

## Bug Registry Impact

None.

## Dependencies

External workflow dependencies:

- GitHub Actions.
- GitHub-hosted `ubuntu-24.04` runner.
- Supported immutable releases of `actions/checkout`,
  `pnpm/action-setup`, and `actions/setup-node` listed in this task.
- Package registry access for frozen dependency installation.
- Docker Compose supplied by the GitHub-hosted runner for configuration
  validation.

No npm or pnpm package dependency is added.

## Commit Decision

Committed as `f556f95 ci: add baseline quality gates` after explicit human
approval.

## Implementation Notes

- Added `.github/workflows/quality.yml` for pull requests and pushes to `main`.
- Added one read-only `quality` job on `ubuntu-24.04` with concurrency
  cancellation and a 15-minute timeout.
- Pinned all referenced actions to immutable SHAs verified against these
  official release tags:
  - `actions/checkout` `v6.0.2`.
  - `pnpm/action-setup` `v6.0.8`.
  - `actions/setup-node` `v6.4.0`.
- Configured pnpm store caching only through `pnpm/action-setup`.
- Added frozen install, frontend and backend typecheck and build, Prisma
  validation, and Docker Compose configuration steps.
- Added no package dependency, lint command, test framework, database runtime,
  deployment behavior, or write permission.

Verification completed:

- `corepack pnpm install --frozen-lockfile` passed without lockfile changes.
- Frontend and backend typechecks passed.
- Frontend and backend builds passed.
- Prisma schema validation passed with the non-secret local demo URL.
- `docker compose --env-file .env.example config --quiet` passed.
- Official action tag SHAs were checked directly with `git ls-remote`.
- Workflow triggers, permissions, concurrency, runner, action pins, cache
  configuration, commands, and environment values were manually reviewed.
- No standalone YAML parser was available in the existing toolchain; no parser
  dependency was added for this infrastructure task.
- No Git remote is configured, so a real GitHub Actions run remains unverified.

## Risks and Open Questions

- The workflow can be validated locally, but an actual GitHub Actions run
  requires a configured remote and separately approved push.
- Exact action release SHAs must be verified against official release tags
  during implementation.
- GitHub-hosted runner images change over time even with a fixed OS label.
  Action and runner updates should be handled through explicit maintenance
  tasks.
- Branch protection remains unconfigured, so the workflow is informative until
  repository settings require the `quality` job.
- Lint and automated tests remain absent by design and need separate approved
  tasks when real product behavior exists.
