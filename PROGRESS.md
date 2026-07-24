# Progress

## Current Phase

Phase 1 - Clean Comics Store core.

## Active Tasks

None.

## Done

- Documentation and governance foundation established.
- High-level product plan stored as a strategic reference.
- Initial planning questions resolved and recorded.
- Codex governance rules task completed.
- Task template added.
- Bug registry convention added.
- Product skeleton planning task completed.
- Repository infrastructure skeleton completed.
- Frontend React, Vite, and TypeScript skeleton completed.
- Backend NestJS and TypeScript skeleton completed with `GET /health`.
- Git repository baseline and first project foundation commit completed.
- Prisma PostgreSQL configuration skeleton completed without product models or
  database runtime.
- Docker Compose local runtime completed with a healthy PostgreSQL service,
  persistent named volume, and no product schema.
- Minimal GitHub Actions quality gates completed for frozen install, frontend
  and backend typechecks and builds, Prisma validation, and Compose validation.

## Blocked

None.

## Decisions Accepted

- React + Vite frontend.
- NestJS backend.
- PostgreSQL + Prisma.
- Docker Compose local-first.
- Docker Compose is the primary MVP runtime; Podman compatibility will be
  evaluated in a separate future infrastructure task.
- pnpm workspaces preferred.
- No Turborepo or Nx at start.
- Document-first workflow.
- Clean Core + Bug Layer.
- Keep Phase 0 as documentation foundation only.
- Keep `docs/high-level-plan.md` as a strategic reference and promote accepted parts only when needed.
- Frontend libraries beyond React + Vite are deferred until approved feature
  tasks require them.
- Zod is the preferred backend DTO validation approach.
- MVP includes minimum checkout address only; full profile editing is later scope.
- MVP may include display-only discounted seed items, without promocodes.
- No separate `ux/` bug registry folder at the start; use existing categories plus metadata.
- Build a fully working clean app before planned bugs.
- Planned bugs should start as flag-controlled.
- Closed bug guide should be hybrid: registry as source of truth, manual hints as guide content.
- Internal API contract should be stored in the repository first, with a protected route later.
- First planned bug pack target is 5-10 bugs.
- Deployment preparation is in scope later; public demo follows after local MVP stability.
- Product skeleton implementation should be split into small tasks: repository infrastructure, frontend skeleton, backend skeleton, database/Prisma skeleton, local runtime wiring, and CI quality gates.
- First implementation task should be repository infrastructure skeleton.
- Repository infrastructure skeleton should create workspace files and empty root folders needed for workspace layout.
- Frontend setup should defer React Router, TanStack Query, React Hook Form, frontend Zod, and i18n until approved feature tasks need them.
- Backend setup should defer Swagger dependencies until API contract or docs work needs them.
- Prisma product schema should wait until the first product data model.
- CI should wait until real lint, typecheck, or test commands exist.
- Root package manager is pinned to pnpm `11.17.0`.
- Frontend runtime is pinned to React `19.2.8` and React DOM `19.2.8`.
- Frontend build foundation uses Vite `8.1.5` and TypeScript `7.0.2`.
- Backend runtime uses NestJS `11.1.28` with the Express adapter.
- Backend build foundation uses NestJS CLI `11.0.24` and TypeScript `5.9.3`.
- Platform health endpoint is `GET /health` with `{ "status": "ok" }`.
- Zod installation is deferred until request DTO validation is implemented.
- Swagger dependencies remain deferred until public/internal API documentation
  work.
- Git commits require an explicit human checkpoint after each completed task or
  implementation step.
- Compatible completed steps may be grouped into one commit after human
  approval.
- Git uses `main` as the initial branch.
- Repository text files are normalized to LF through `.gitattributes`.
- Prisma CLI is pinned to `7.9.0` with dotenv `17.4.2`.
- Prisma remains root-level until generated client sharing justifies a dedicated
  database workspace.
- Prisma Client, PostgreSQL adapter, driver, product models, migrations, and
  seeds remain deferred.
- pnpm lifecycle scripts are allowed only for the pinned `prisma` and
  `@prisma/engines` packages; unreviewed package scripts remain blocked.
- The initial CI baseline uses one read-only `ubuntu-24.04` quality job.
- GitHub Actions dependencies are pinned to immutable release commit SHAs.
- CI lint and automated test gates remain deferred until real commands exist.

## Decisions Still Pending

- UI kit.
- Exact auth implementation details.
- Deployment target.
- Exact test command structure.
