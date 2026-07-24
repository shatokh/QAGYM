# Task 0004: Frontend App Skeleton

## Status

Done

## Behavior Type

Infrastructure

## Background

Tasks `0002-product-skeleton-planning.md` and
`0003-repository-infrastructure-skeleton.md` established the implementation
sequence and the root pnpm workspace. The next step is a minimal frontend
workspace that proves React, Vite, and TypeScript can run and build under
`apps/web`.

This task creates infrastructure only. It does not implement a store feature or
make frontend architecture choices that are not yet required.

Relevant references:

- `docs/tasks/0002-product-skeleton-planning.md`
- `docs/tasks/0003-repository-infrastructure-skeleton.md`
- `PROJECT_BRIEF.md`: frontend technology direction.
- `docs/architecture.md`: planned `apps/web` location.
- `docs/high-level-plan.md`: proposed frontend libraries and deferred decisions.
- `AGENTS.md`: task-first, scope lock, and no hidden dependencies.

## Scope

- Create a pnpm workspace package at `apps/web`.
- Configure a minimal React + Vite + TypeScript application.
- Add only the files needed to run, typecheck, build, and preview the frontend.
- Replace generated Vite demonstration content with a simple QA Comics Gym app
  shell that clearly identifies the application and its skeleton status.
- Keep the app shell static and free of product behavior.
- Add package scripts:
  - `dev`
  - `build`
  - `typecheck`
  - `preview`
- Add truthful root package scripts for invoking the frontend commands if useful
  for local development.
- Add or update a root `.gitignore` for dependency folders, frontend build
  output, local environment files, and common local tooling artifacts.
- Generate and commit `pnpm-lock.yaml`.
- Pin the pnpm version in the root `package.json` when the package manager is
  activated for installation.
- Update `PROGRESS.md` and `docs/local-development.md` with the commands that
  actually work after implementation.

## Proposed File Set

The implementation is expected to create:

- `apps/web/package.json`
- `apps/web/index.html`
- `apps/web/vite.config.ts`
- `apps/web/tsconfig.json`
- TypeScript project config files required by the selected Vite setup.
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/index.css`
- `apps/web/src/vite-env.d.ts`
- Root `pnpm-lock.yaml`
- Root `.gitignore`

Generated files may differ slightly if the current official Vite React
TypeScript setup requires an equivalent structure. Any extra generated demo
assets or optional tooling must be removed or proposed as an amendment.

## Approved Dependency Boundary

Runtime dependencies:

- `react`
- `react-dom`

Development dependencies:

- `vite`
- `typescript`
- `@vitejs/plugin-react`
- `@types/react`
- `@types/react-dom`

Exact versions must be resolved and recorded in `apps/web/package.json` and
`pnpm-lock.yaml` during implementation. No other package may be added without an
approved amendment.

## Out of Scope

- Catalog, product details, auth, cart, checkout, orders, or admin behavior.
- API integration or backend proxy configuration.
- React Router.
- TanStack Query.
- React Hook Form.
- Zod for frontend validation.
- Internationalization libraries or RU/EN content implementation.
- A UI kit, component library, icon library, or design system decision.
- State management libraries.
- CSS frameworks or preprocessors.
- Frontend tests, test libraries, and coverage configuration.
- ESLint, Prettier, or other formatting and lint tooling.
- Storybook.
- Environment-specific application configuration.
- Docker and deployment configuration.
- Planned bugs or bug registry entries.

## Acceptance Criteria

- `apps/web` is a valid pnpm workspace package.
- The frontend starts locally with its documented development command.
- The page renders a minimal QA Comics Gym shell without Vite starter logos,
  counters, or sample behavior.
- TypeScript strict mode is enabled.
- Production build completes successfully.
- Typecheck completes successfully without emitting files.
- Preview command can serve the production build.
- Root scripts, if added, invoke real frontend commands.
- `pnpm-lock.yaml` is committed and matches declared dependencies.
- The root package records the selected pnpm version.
- No dependency outside the approved dependency boundary is declared or
  installed.
- No product feature, API integration, test setup, planned bug, or bug registry
  entry is introduced.
- Local development and progress documentation match the implemented commands.

## Verification Plan

After dependency installation:

- Run the frontend typecheck command.
- Run the frontend production build command.
- Start the development server and verify the page responds locally.
- Start the preview server and verify the production build responds locally.
- Inspect the rendered page for the QA Comics Gym shell and absence of Vite demo
  content.
- Verify the package manifest contains only approved dependencies.
- Verify no out-of-scope frontend libraries or product files were added.

No frontend test command is expected in this task.

## Documentation Impact

Update:

- `README.md`
- `PROGRESS.md`
- `docs/local-development.md`

Update `docs/architecture.md` only if the actual workspace structure differs
from the documented plan.

## API Contract Impact

None. This task does not call or describe an API.

## Seed Data Impact

None.

## Test Impact

None. This task establishes build and typecheck verification only; it does not
create health, behavior, contract, bug verification, or performance tests.

## Bug Registry Impact

None.

## Dependencies

This task introduces only the packages listed in the Approved Dependency
Boundary.

Implementation requires:

- Node.js compatible with the selected Vite and TypeScript versions.
- pnpm activated through Corepack or an equivalent approved local setup.
- Package registry access to resolve and install dependencies.

The implementation environment reports Node.js `v22.17.0`. The pinned pnpm
version is available through Corepack, and registry access is required for a
fresh dependency installation.

## Implementation Notes

- Created the `@qa-comics-gym/web` workspace under `apps/web`.
- Added a minimal static QA Comics Gym shell without store behavior or generated
  Vite demonstration content.
- Pinned pnpm `11.17.0` and Node.js `>=22.13.0` in the root package.
- Pinned React `19.2.8`, React DOM `19.2.8`, Vite `8.1.5`, TypeScript `7.0.2`,
  React plugin `6.0.4`, and the approved React type packages.
- Added only the approved direct dependencies.
- Added root commands for frontend development, typecheck, build, and preview.
- Added a workspace-safe root `.gitignore` and generated `pnpm-lock.yaml`.
- Updated current status and local development documentation.

Verification completed:

- `corepack pnpm typecheck:web` passed.
- `corepack pnpm build:web` passed.
- The development server responded with HTTP `200` on
  `http://127.0.0.1:5173/`.
- The production preview responded with HTTP `200` on
  `http://127.0.0.1:4173/`.
- Both served documents contained the QA Comics Gym title and React root.
- Source and build output contain the intended app shell and no Vite starter
  logo or counter content.
- Browser-based visual verification was not available in the current tool
  session. No additional browser test dependency was added.

## Risks and Open Questions

- Package installation required the locally trusted Avast web shield CA to be
  supplied to Node through a temporary CA file. TLS verification remained
  enabled, and no machine-specific registry setting was committed.
- Linting and frontend tests remain intentionally deferred. They need explicit
  tool choices and approved tasks before CI can enforce them.
