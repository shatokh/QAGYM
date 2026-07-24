# High-Level Product Plan

This document captures the current high-level product plan for QA Comics Gym and records analysis notes, resolved planning decisions, open questions, and possible conflicts. It is a planning document, not an implementation task.

The existing accepted decisions remain in ADRs and `PROGRESS.md`. Items marked as open questions or proposed details still need explicit approval through task documents or ADR amendments before implementation.

## Current Foundation Status

The repository is no longer documentation-only. It currently contains pnpm
workspaces, React/Vite and NestJS skeletons, Prisma PostgreSQL configuration, a
Docker Compose PostgreSQL runtime, and baseline GitHub Actions quality gates.

No product model, migration, seed implementation, catalog behavior, formal API
contract, or automated product test suite exists yet.

## Product Concept

QA Comics Gym is a QA training sandbox based on a realistic dummy comics e-commerce store.

Users should eventually be able to:

- Test the UI as a guest.
- Register and log in.
- Test authenticated user scenarios.
- Test admin scenarios.
- Work with API endpoints.
- Write manual checklists and test cases outside the platform.
- Write automation tests with their preferred framework.
- Use Swagger/OpenAPI documentation.
- Search for functional, API, UI, security, accessibility, performance, localization, mobile, and reliability bugs.

The MVP is not an LMS. It should not start with courses, progress tracking,
scoring, answer checks, mentor review, or challenge building. It should first be
a correct clean product and later become a controlled training product with
registered planned bugs.

## Core Architecture Idea

The project should use the Clean Core + Bug Layer principle:

1. Build a minimal comics store that works correctly.
2. Cover basic happy-path scenarios with internal tests.
3. Create a bug registry.
4. Introduce planned bugs as controlled deviations from clean behavior.
5. Give each planned bug an ID, description, difficulty, area, activation method, and testing notes.

Planned bugs should be represented explicitly in code and documentation. The implementation should make it possible to distinguish educational defects from accidental platform defects.

## Modes and Bug Flags

The proposed MVP mode model is intentionally simple:

- Clean/dev mode: Used by developers and CI. Planned bugs are disabled where possible.
- Training mode: Main user-facing mode. Planned bugs should initially be
  flag-controlled and disabled by default. A later default-on training pack can
  be selected after the clean app and bug layer are stable.
- Spoiler/admin mode: Does not change app behavior, but opens privileged bug documentation.

The proposed technical direction is environment or configuration-based flags, for example:

```text
APP_MODE=training
ENABLE_BUG_CART_DUPLICATE=true
ENABLE_BUG_WRONG_ORDER_TOTAL=true
ENABLE_BUG_SWAGGER_MISMATCH=true
```

The MVP should avoid a complex challenge builder, per-user bug configuration, dynamic UI-based bug management, or database-backed mode management.

The product must be built as a fully working clean app before planned bugs are implemented. Planned bug flags are kept in mind during architecture design, but planned bugs should not be mixed into clean feature tasks.

## Proposed MVP Stack Details

Accepted direction already recorded elsewhere:

- React + Vite + TypeScript frontend.
- NestJS + TypeScript backend.
- PostgreSQL.
- Prisma.
- Docker Compose local-first runtime.
- pnpm workspaces preferred.
- No Turborepo or Nx at the start.

Additional proposed frontend details:

- React Router.
- TanStack Query.
- React Hook Form.
- Zod.
- RU/EN-ready i18n architecture, likely `react-i18next`.

Additional proposed backend details:

- JWT auth with refresh token flow.
- Swagger/OpenAPI.
- Zod as the primary backend DTO validation approach.

Additional proposed testing details:

- Vitest for frontend unit or component logic.
- Jest for backend unit tests if staying close to NestJS defaults.
- Supertest for backend API and integration tests.
- Playwright for E2E and UI regression.
- k6 for performance smoke and small load scenarios.

Current infrastructure foundation:

- Docker Compose.
- PostgreSQL container.
- GitHub Actions for CI.
- Frontend and backend run on the host during local development.

Still-proposed infrastructure details:

- Prisma product migrations and deterministic seed data.
- Backend and frontend containers only if later deployment work requires them.

## Domain Modules

### Public Store

Guest users should be able to:

- Open the home page.
- Browse the catalog.
- Search comics.
- Filter by genre, author, series, and price.
- Open comic details.
- Switch RU/EN language.
- See clear error and empty states.

### Auth

Users should be able to:

- Register.
- Log in.
- Log out.
- Refresh tokens.
- Use demo accounts.

Password recovery is not required for MVP.

### Customer Area

Authenticated users should be able to:

- Add products to the cart.
- Change quantity.
- Remove products.
- Checkout without real payment.
- View order history.
- Provide the minimum checkout address needed for order scenarios.

Full profile editing is not part of MVP and should be moved to a later phase.

### Admin Area

Admin users should be able to:

- Open a dashboard.
- Create and edit products.
- Change stock.
- View orders.
- Change order status.
- View users with care, keeping planned security simulations safe.

### Documentation Area

Public documentation should include:

- Project description.
- How to test.
- Available roles.
- Demo credentials.
- Business rules.
- Public API docs.
- Automation guide.
- Seed data guide.

Closed documentation should include:

- Bug registry details.
- Planned bugs.
- Expected vs actual behavior.
- Difficulty levels.
- Affected roles.
- Bug flags.
- Hints.
- Related endpoints and pages.

## API Documentation Model

The plan supports two API documentation layers:

### Public Training Swagger

This is the API surface visible to QA users. It may intentionally include training defects only if those mismatches are registered planned bugs.

Possible planned API documentation defects:

- Incomplete descriptions.
- Outdated fields.
- Incorrect response examples.
- Nullable or required mismatches.
- Incorrect status codes.
- Missing edge-case documentation.

### Internal Developer API Contract

This is the implementation-facing contract used by developers, Codex, and CI. It should reflect expected clean core behavior.

Potential locations:

- `/docs/api` for public training Swagger.
- `/internal/docs/api` for protected internal Swagger.
- CI artifact for internal spec instead of publishing it in the app.

All intentional API doc mismatches must be linked to bug registry entries.

## Bug Registry Direction

For MVP, the preferred registry format is YAML or MDX with YAML front matter. A file-based registry is preferred over a database-backed registry at the start because it is easier to review, version, connect to code, and use for generated documentation later.

Example registry shape:

```text
bug-registry/
  functional/
  api/
  security/
  performance/
  accessibility/
  localization/
  mobile/
  reliability/
```

Example planned bug metadata:

```yaml
id: BUG-CART-003
title: Cart creates duplicate lines after fast double click
area: Cart
type: Functional
difficulty: L3
status: active
activation:
  mode: flag
  flag: ENABLE_BUG_CART_DUPLICATE
enabledByDefault: false
affectedRoles:
  - authorized_user
surfaces:
  - UI
  - API
testTypes:
  - manual
  - automation
expectedBehavior: Same item should increase quantity in one cart line.
actualBehavior: Fast repeated action can create duplicated cart lines.
relatedEndpoints:
  - POST /cart/items
  - GET /cart
relatedPages:
  - /cart
hints:
  - Try fast repeated clicks.
  - Compare UI cart and API response.
```

## Planned Bug Categories

The MVP should include a limited number of well-designed planned bugs instead of trying to cover every category deeply.

Suggested first categories and examples:

- Functional: duplicate cart lines, wrong total calculation, out-of-stock checkout, price filter boundary issue.
- API: wrong status code, schema mismatch, wrong pagination total, sorting only on first page, invalid quantity accepted.
- Auth and authorization: safe guest data exposure simulation, safe admin endpoint access simulation, refresh token edge case, logout session issue in training mode.
- Security: safe IDOR simulation, safe broken access control on demo data, reflected XSS in a sandbox field, missing login rate limit simulation, fake sensitive-looking data leakage, verbose errors.
- Accessibility: missing input labels, keyboard navigation defect, contrast issue, modal focus trap bug.
- Performance: heavy catalog with large seed dataset, inefficient search, N+1 endpoint, slow images or missing lazy loading.
- UX: unclear empty state, short-lived toast, inconsistent validation messages, submit button remains active during submit. Do not create a separate `ux/` registry folder for now; classify UX defects under existing categories and use metadata such as `surface: UX`.
- Localization: untranslated strings, wrong price or date format, long RU text breaks layout, wrong fallback language.
- Mobile and cross-browser: 360px layout issue, sticky header overlaps form, hover-only interaction, possible Safari or Firefox CSS edge case.
- Reliability: double-checkout race condition, flaky endpoint, retry defect, inconsistent state after failed request.

## Seed Data Direction

Seed scenarios are part of the product, not just setup data.

Phase 1 should introduce the minimum deterministic clean catalog seed and its
repeatable reset path. Phase 2 should extend seed behavior with users, roles,
demo accounts, and auth-oriented scenarios.

Accepted catalog data directions:

- Localized catalog text should use normalized translation records.
- Money should use integer minor units plus an ISO currency code.
- Display-only discounted items may use an optional comparison price without a
  promocode or discount engine.
- Clean catalog covers should use stable local assets.
- Missing cover data should use a deterministic clean fallback. A broken cover
  URL is planned bug behavior and must not appear in the clean seed.

Suggested demo users:

- Guest, without credentials.
- `user.demo@example.com`.
- `admin.demo@example.com`.
- `blocked.demo@example.com`.
- `edgecase.demo@example.com`.

Suggested product data:

- Normal comic.
- Out-of-stock comic.
- Comic with very long title.
- Comic with missing image.
- Display-only discounted item, without promocodes or discount calculation logic.
- Unicode title.
- RU/EN localized title.
- Expensive item.
- Cheap item.
- Limited edition item.
- Item with huge description.

Suggested order data:

- User with empty order history.
- User with many orders.
- Cancelled order.
- Paid-like order without real payment.
- Pending order.
- Order with unavailable item.
- Order near timezone boundary.

## Internal Test Taxonomy

The planned test taxonomy remains:

- Health tests: App, API, database, migrations, seed data, login, and catalog basics. These should always be green.
- Core behavior tests: Clean core behavior with bug flags disabled.
- Bug verification tests: Planned bugs reproduce in training mode or when flags are enabled.
- Contract tests: Internal API contract, not public training Swagger.
- Performance smoke tests: k6 scenarios for catalog, product details, login, add to cart, and checkout.

Relevant internal contracts and clean behavior tests should be developed with
each feature. Phase 8 expands automation coverage and training ergonomics; it
does not introduce the first clean product tests.

## MVP Scope Summary

In MVP:

- React UI.
- NestJS API.
- PostgreSQL + Prisma.
- Docker Compose.
- Auth.
- Guest, user, and admin roles.
- Demo users.
- Catalog.
- Product page.
- Cart.
- Checkout without payment.
- Minimum checkout address for order scenarios.
- Order history.
- Admin product and order management.
- Public Swagger.
- Internal API docs or internal contract.
- Docs page.
- Closed bug guide.
- Bug registry in YAML or MDX.
- Bug flags through config or env.
- Seed scenarios.
- Internal tests.
- Playwright smoke tests.
- k6 smoke tests.
- RU/EN-ready structure.

Not in MVP:

- Gamification.
- User progress.
- Auto-grading.
- Built-in bug tracker.
- Mentor review.
- Challenge builder.
- Full LMS.
- Payments.
- Real email.
- Production-grade observability.
- Redis or queues.
- Multi-tenant architecture.

## Repository Structure Direction

Proposed future structure:

```text
qa-comics-gym/
  apps/
    web/
    api/

  packages/
    shared/
    test-utils/

  docs/
    public/
    internal/
    automation/
    api/

  bug-registry/
    functional/
    api/
    security/
    performance/
    accessibility/
    localization/
    mobile/
    reliability/

  tests/
    e2e/
    api/
    performance/

  prisma/
    schema.prisma
    migrations/
    seed/

  compose.yaml
  README.md
```

Parts of this structure are now implemented. `docs/architecture.md` is the
source of truth for the current repository layout; this section remains a
future direction and must not override implemented structure.

## Analysis Notes

The high-level plan is mostly consistent with the current project direction.
The strongest aligned decisions are:

- QA Comics Gym as a dummy comics e-commerce sandbox.
- Local-first MVP.
- Clean Core + Bug Layer.
- File-based bug registry.
- Public training Swagger plus internal developer contract.
- Safe security simulations only.
- No LMS, gamification, scoring, progress tracking, challenge builder, real payments, real email, Redis, queues, or multi-tenant SaaS in MVP.

Potential conflicts or areas needing clarification:

- Phase numbering conflict is resolved: existing `ROADMAP.md` keeps Phase 0 as documentation foundation only. Product skeleton work belongs to the next implementation phase.
- Scope density: this plan's MVP includes a broad store, admin area, docs area, closed guide, API contracts, seed scenarios, tests, Playwright, k6, and bug infrastructure. It is coherent, but too large for a single MVP task. It should be split into phases.
- Public Swagger intentional mismatches: useful for training, but risky if not strictly registry-driven. The internal contract must remain the source for clean expected behavior.
- Always-on bugs are deferred. Planned bugs should be introduced only after the
  clean app exists, and should start as flag-controlled and disabled by default.
  A default-on bug pack can be selected later.
- Auth details: JWT plus refresh token flow is proposed, but exact token storage, expiry, invalidation, and logout behavior are still not decided.
- Validation stack is resolved at planning level: use Zod as the primary backend DTO validation approach.
- Admin user visibility: the plan says admin can view users, but this must be scoped carefully to avoid unsafe security examples or unnecessary privacy-like data.
- Profile and address editing is resolved: MVP includes only the minimum checkout address. Full profile editing moves later.
- Discounts are resolved: MVP may include display-only discounted seed data, but no promocodes.
- UX category is resolved: no separate `ux/` folder now. Use existing categories plus metadata.
- Deployment notes: provider free-tier details are time-sensitive and should not be fixed as decisions without verification during the deployment phase.

## Resolved Planning Decisions

1. Keep the current Phase 0 as documentation foundation only. Product skeleton work starts in the next implementation phase.
2. Keep `docs/high-level-plan.md` as a strategic reference. Promote accepted parts into project docs, roadmap, or ADRs only when needed.
3. Keep React Router, TanStack Query, React Hook Form, Zod for frontend validation, and `react-i18next` as proposed details until the frontend setup task.
4. Use Zod as the primary backend DTO validation approach.
5. MVP includes only the minimum checkout address needed for checkout and order scenarios. Full profile editing is later scope.
6. MVP may include display-only discounted items in seed data, but no promocodes.
7. Do not add a separate `ux/` bug registry folder now. Classify UX defects under existing categories and use metadata.
8. Build a fully working clean app first. Planned bugs come later and should start as flag-controlled. A default-on training pack can be selected later.
9. Use a hybrid closed bug guide: registry files are the source of truth, and the closed guide manually adds hints and mentor-friendly notes.
10. Store the internal API contract in the repository first. A protected route can be added later.
11. First planned bug pack should be small: 5-10 bugs.
12. MVP should include deployment preparation only. Public demo comes after the local MVP is stable.
13. Phase 1 includes a minimal deterministic clean catalog seed and reset path.
14. Internal behavior/API contracts and clean feature tests evolve with each
    feature. Phase 5 publishes docs, and Phase 8 expands automation readiness.
15. RU/EN-ready catalog content should use normalized translation records.
16. Money should use integer minor units plus an ISO currency code.
17. Clean catalog media should use stable local assets with a deterministic
    missing-media fallback.
18. Task type follows primary behavior intent. A directly supporting product
    migration may remain in an explicitly scoped Clean Feature task.

## Remaining Questions

- Exact auth implementation details: token storage, expiry, refresh behavior, invalidation, and logout semantics.
- UI kit.
- Exact frontend setup choices.
- Exact test command structure.
- Deployment target.
- Catalog entity relationships, identifiers, slugs, publication and stock
  rules, deterministic ordering, pagination, search, and filtering.
- Repository visibility and the spoiler threat model for repository-backed bug
  registry content.
