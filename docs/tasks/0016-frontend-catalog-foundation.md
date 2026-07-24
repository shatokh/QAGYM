# Task 0016: Frontend Catalog Foundation

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24.
- Accepted planning direction: The human project owner selected localized URLs
  and required frontend and backend work to follow production development
  standards on 2026-07-24. The owner also accepted the proposed Playwright
  testability recommendations on 2026-07-24: semantic-first locators, limited
  stable test IDs, observable UI states, real clean E2E infrastructure, and a
  separate first Playwright task after the catalog UI.
- Approved scope notes: All eleven recommendations were accepted, including
  localized URL paths, React Router, same-origin API proxying, TanStack Query,
  frontend-owned Zod contracts, i18next, Vitest and Testing Library, explicit
  test command semantics, semantic-first automation surfaces, a separate
  Playwright task after `0017`, and no UI kit in this task.
- Amendment: The human project owner approved adding
  `@testing-library/dom@10.4.1` on 2026-07-24 after registry metadata confirmed
  it is a required direct peer of the approved Testing Library packages.

The approved decisions and scope are locked for implementation.

## Behavior Type

Clean Feature

The task creates the frontend boundary needed to consume the implemented clean
catalog API. Routing, locale handling, API access, runtime contract validation,
and directly supporting tests are part of this first frontend product slice.

## Background

Tasks `0012` through `0015` completed the clean catalog schema, migration,
deterministic seed, local media, backend test foundation, catalog read API, and
internal API contract. The frontend is still the static skeleton from task
`0004`; it has no routing, locale model, API client, server-state management, or
test setup.

The approved Phase 1 sequence now reaches:

1. `0015` - Catalog Read API and Internal Contract: done.
2. `0016` - Frontend Catalog Foundation: this task.
3. `0017` - Catalog List and Product Detail UI: next task.
4. Later Phase 1 tasks - search, filters, and expanded automation.

This task must establish stable frontend boundaries without implementing the
final catalog list or product-detail design. It must also interpret
"production standards" concretely within the local MVP:

- Strict, explicit TypeScript boundaries.
- Validated runtime configuration and API responses.
- Deterministic routing and locale behavior.
- Centralized request and error handling.
- Request cancellation and server-state ownership.
- Error boundaries and accessible route states.
- Automated tests and CI enforcement.
- No browser secrets, development-only runtime assumptions, or silent
  fallbacks that hide contract failures.

Production deployment, production observability, and broad security hardening
remain outside MVP scope unless separately approved.

Relevant references:

- `docs/tasks/0011-phase-1-catalog-foundation-plan.md`
- `docs/tasks/0015-catalog-read-api-and-internal-contract.md`
- `docs/internal/api/catalog.md`
- `docs/product/catalog.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/conventions/frontend-testability.md`
- `docs/local-development.md`
- `AGENTS.md`

## Goal

Create a tested, localized, production-structured frontend foundation that can
consume the clean catalog API and provide stable routes and data boundaries for
task `0017`.

## Proposed Review Decisions

These recommendations become scope-locked only after human approval of this
task.

### 1. Localized URL Model

Options:

1. Locale path prefix: `/en/comics` and `/ru/comics`.
2. Query locale: `/comics?locale=en`.
3. Runtime-only locale stored outside the URL.

Recommendation: option 1, already accepted as the planning direction.

Detailed rules:

- Initial supported route locales are exactly `en` and `ru`.
- Catalog routes are `/:locale/comics` and
  `/:locale/comics/:slug`.
- `/` redirects to `/en/comics`.
- Unsupported locale prefixes render the route not-found state instead of
  silently changing language.
- Navigation preserves the selected locale.
- Catalog slugs remain locale-independent.
- Pagination and future filter state use query parameters, not additional path
  segments.
- The active route locale controls both UI messages and the catalog API
  `locale` query.
- The document `<html lang>` value follows the active route locale.
- No browser-language auto-detection is added in the first slice.

Benefits:

- Routes are deterministic and shareable.
- Manual and automated tests can select language directly.
- Locale does not depend on browser storage or machine settings.
- Future auth, cart, checkout, and docs routes can follow one URL convention.

### 2. Routing Library

Options:

1. React Router with a declarative route tree and route-level error handling.
2. A hand-written History API router.
3. Render all frontend states from one component without routing.

Recommendation: option 1.

Benefits:

- Uses a proven routing implementation.
- Supports nested layouts, not-found behavior, and future route expansion.
- Avoids custom navigation and history edge cases.

The task should add only routes and boundaries needed for the app shell,
localized catalog list, localized detail, redirect, and not-found behavior.

### 3. API Origin and Local Proxy

Options:

1. Browser requests same-origin `/api`; Vite proxies `/api` to the local
   backend during development.
2. Browser uses a cross-origin `VITE_API_BASE_URL` and the backend enables
   CORS.
3. Hard-code `http://localhost:3000` in frontend source.

Recommendation: option 1.

Rules:

- Frontend source requests relative product paths such as `/api/v1/comics`.
- Vite reads a development-only proxy target from
  `VITE_API_PROXY_TARGET`.
- The committed example value is `http://localhost:3000`.
- Invalid proxy target configuration fails clearly when Vite configuration is
  evaluated.
- Production output assumes the frontend host or reverse proxy serves `/api`.
- No credential, token, database URL, or other secret uses the browser-exposed
  `VITE_` namespace.
- This task does not modify backend CORS behavior.

Benefits:

- Local browser behavior matches a common same-origin production topology.
- No broad CORS policy is introduced before a deployment topology exists.
- API endpoint construction remains independent from developer ports.

### 4. Server-State Ownership

Options:

1. TanStack Query with one centralized catalog API client.
2. Component-local `useEffect` and `fetch`.
3. Add a general global state library and store API data there.

Recommendation: option 1.

Rules:

- Use the platform `fetch` implementation; do not add Axios.
- Query keys include every server input, including locale, page, and page size.
- Pass TanStack Query cancellation signals to `fetch`.
- Keep retry behavior finite and explicitly configured.
- Do not retry deterministic `400` or `404` responses.
- Do not copy server data into a second global store.
- Keep query defaults in one application-owned provider.
- Components in task `0017` consume catalog hooks instead of calling `fetch`.

Benefits:

- Prevents duplicated request, cache, retry, and stale-state logic.
- Supports predictable loading, failure, and pagination behavior.
- Provides a stable testing boundary without introducing broad client state.

### 5. Frontend API Contract Validation

Options:

1. Frontend-owned Zod schemas matching the internal catalog contract.
2. TypeScript interfaces only, with unchecked JSON at runtime.
3. Create `packages/shared` and refactor backend contracts into it now.

Recommendation: option 1.

Rules:

- Define frontend DTO types from Zod schemas.
- Validate successful catalog list and detail responses before exposing them to
  UI hooks.
- Parse the documented API error envelope when possible.
- Convert HTTP, network, abort, and response-validation failures into a small
  typed frontend error model.
- Keep technical details available for development diagnostics but do not
  render stack traces or raw payloads to users.
- Treat an incompatible successful response as a contract failure, not as
  empty catalog data.
- Do not create `packages/shared` or import generated Prisma types.

Benefits:

- Detects API drift at the browser boundary.
- Keeps database representation out of frontend code.
- Avoids a cross-workspace refactor before shared ownership is justified.

The frontend and backend schemas will be intentionally duplicated at this
stage. Contract tests and the internal contract control that duplication.

### 6. UI Localization Runtime

Options:

1. `i18next` with `react-i18next` and repository-owned EN/RU resources.
2. A custom dictionary context.
3. Hard-coded conditional strings in components.

Recommendation: option 1.

Rules:

- Store UI messages in explicit EN and RU resource modules.
- Initialize locale from the validated route segment.
- Do not add browser-language detection or local-storage persistence.
- Do not use translated text as program logic or test selectors.
- Missing UI translation keys must be visible during development rather than
  silently replaced with unrelated content.
- API content continues to use the API's observable `contentLocale`.

Benefits:

- Establishes one reusable localization boundary for later store modules.
- Keeps route locale and UI locale synchronized.
- Avoids bespoke interpolation and pluralization behavior.

### 7. Frontend Test Foundation

Options:

1. Vitest, Testing Library, `jest-dom`, `user-event`, and jsdom.
2. Vitest with implementation-level tests only.
3. Defer all frontend tests until task `0017`.

Recommendation: option 1.

Rules:

- Add a frontend `test` command that runs once and exits.
- Add an explicit root `test:web` command.
- Keep the existing API workspace unit and HTTP API commands intact.
- Add a distinct frontend unit/component gate to CI.
- Add shared test rendering helpers only where they remove real provider setup
  duplication.
- Test behavior through routes, accessible roles, visible states, and public
  API module results rather than private implementation details.
- Mock the platform `fetch` boundary without adding MSW in this task.
- Do not add snapshot-only coverage.

Initial coverage should verify:

- Root redirect to `/en/comics`.
- EN and RU route recognition.
- Unsupported locale not-found behavior.
- Route locale synchronization with i18n and `<html lang>`.
- API request query construction.
- Successful list/detail response validation.
- Stable API error parsing.
- Malformed successful response rejection.
- Query keys include locale and pagination inputs.
- Application and route error boundaries render safe accessible states.

Benefits:

- Task `0017` can add UI behavior with tests from its first implementation.
- CI catches routing, locale, and contract regressions immediately.
- The tests exercise user-visible boundaries rather than component internals.

### 8. Root Test Command Semantics

Options:

1. Keep root `pnpm test` as the aggregate unit command and add explicit root
   `test:web` and `test:unit:api` commands for separate CI gates.
2. Change root `pnpm test` to backend-only and use a different aggregate
   command.
3. Keep only the recursive command and let CI call workspace commands
   directly.

Recommendation: option 1.

Rules:

- `pnpm test` runs all workspace unit/component suites that expose `test`.
- `pnpm test:web` runs only the frontend Vitest suite.
- `pnpm test:unit:api` runs only backend Jest unit tests.
- `pnpm test:api` retains its current meaning: database-backed HTTP API tests.
- CI uses the three explicit commands and does not also run the aggregate
  command.
- Test documentation must not call aggregate `pnpm test` a backend-only gate.

Benefits:

- Local developers retain one unit-test command.
- CI output clearly identifies the failing frontend, backend unit, or backend
  API boundary.
- Frontend tests are not run twice in the same CI job.

### 9. Automation Testability Contract

Options:

1. Semantic-first locators with limited stable `data-testid` contracts.
2. Add `data-testid` to every visible element.
3. Defer all selector and observable-state decisions until Playwright is
   installed.

Recommendation: option 1, accepted as the planning direction.

Rules:

- Follow `docs/conventions/frontend-testability.md`.
- Prefer roles, labels, alternative text, and other user-facing semantics.
- Use standard `data-testid` only where semantic identity is ambiguous,
  localized, or insufficient for a repeated domain entity.
- Use lowercase kebab-case IDs and stable public slugs or SKUs where entity
  identity is required.
- Do not use database IDs, indexes, translated text, styling classes, XPath, or
  deep DOM structure as automation identity.
- Keep test IDs in production output and treat used IDs as reviewable
  automation contracts.
- Never encode planned bug IDs, flag names, credentials, hints, or spoiler
  details in test IDs.
- Make loading, empty, error, disabled, and not-found states observably
  distinct through semantic markup and accessibility state.
- Add no fixed delay for component or future E2E synchronization.

The task should establish only shell and route-state testability targets such
as `app-shell`, `locale-switcher`, loading, error, and not-found surfaces. Task
`0017` owns catalog-grid, comic-card, pagination, and detail-page testability.

Benefits:

- Accessibility semantics become the primary automation surface.
- EN/RU workflows do not require fragile translated selectors.
- Future E2E tests can avoid CSS, XPath, and arbitrary waits.
- Automation IDs remain useful to QA users without leaking planned bugs.

### 10. Playwright Introduction Timing

Options:

1. Install Playwright in task `0016`.
2. Install Playwright together with the catalog UI in task `0017`.
3. Create a separate first clean catalog Playwright smoke task after `0017`.

Recommendation: option 3, accepted as the planning direction.

The future Playwright task should:

- Run against the real frontend, backend, migrated PostgreSQL, and deterministic
  clean seed.
- Keep planned bugs explicitly disabled.
- Reserve `pnpm test:e2e` for Playwright.
- Configure managed web servers, `baseURL`, CI `forbidOnly`, trace on first
  retry, and failure artifacts.
- Start with the clean localized catalog list/detail workflow.
- Keep request mocking limited to focused resilience scenarios.
- Define isolation before adding auth, cart, checkout, or other write flows.

Phase 8 remains responsible for expanded browser, fixture, scenario, and CI
coverage rather than the first Playwright introduction.

### 11. UI Kit and Styling Boundary

Options:

1. Add no UI kit in `0016`; decide the visual component boundary in `0017`.
2. Select and install a full UI kit now.
3. Add a CSS framework before the catalog design exists.

Recommendation: option 1.

Benefits:

- Routing, data, locale, and tests do not depend on an unreviewed visual system.
- Task `0017` can evaluate the real catalog interactions and accessibility
  needs before selecting components.
- Production structure does not require a large component dependency.

The existing skeleton CSS may be minimally adjusted for route placeholders and
accessible error states. Final catalog layout, product cards, responsive design,
and visual polish remain task `0017`.

## Scope

### Routing and Application Composition

- Add React Router.
- Add the localized app route tree and root redirect.
- Add application providers for routing, server state, and localization.
- Add route-level not-found and unexpected-error boundaries.
- Keep route modules small and feature-oriented.

### API and Server State

- Add the frontend-owned catalog contract schemas and inferred types.
- Add a centralized `fetch`-based catalog API client.
- Add list and detail query options/hooks for task `0017`.
- Add typed frontend API errors and cancellation behavior.
- Add same-origin API requests and Vite development proxy configuration.
- Update `.env.example` with the non-secret proxy target.

### Localization

- Add `i18next` and `react-i18next`.
- Add repository-owned EN/RU UI resource modules.
- Synchronize route locale, API locale, UI locale, and document language.
- Translate only the shell, route placeholder, loading, error, and not-found
  messages introduced by this task.

### Tests and CI

- Add Vitest and Testing Library test configuration.
- Add focused routing, locale, API boundary, query, and error tests.
- Add frontend test commands.
- Add a separate frontend test gate to the existing CI workflow.
- Keep root `pnpm test` as the aggregate unit command and add explicit
  `test:web` and `test:unit:api` commands for CI separation.

### Production Development Baseline

- Preserve strict TypeScript and avoid `any` at public boundaries.
- Keep environment access centralized and validated.
- Keep API access outside presentation components.
- Use deterministic errors and explicit fallback behavior.
- Use semantic HTML and accessible names for visible route states.
- Follow the frontend testability convention.
- Add stable test IDs only for approved shell and route-state automation
  surfaces where semantic locators are insufficient.
- Provide a main-content region, skip target, logical heading structure,
  visible focus, and route-aware document title.
- Expose loading, error, and not-found state without arbitrary timing.
- Avoid global mutable runtime state and module-level request side effects.
- Keep the production build free of development credentials and hard-coded
  localhost API origins.

### Documentation Synchronization

- Update `docs/architecture.md` with frontend route, provider, API, and locale
  ownership.
- Update `docs/testing-strategy.md` with the frontend test gate.
- Update `docs/local-development.md` with proxy and test commands.
- Update `docs/product/catalog.md` with the localized frontend route contract.
- Add `docs/conventions/frontend-testability.md` as the selector and observable
  state contract for this and future frontend tasks.
- Update `AGENTS.md` with the resolved frontend and aggregate test commands.
- Update `README.md` and `PROGRESS.md` with current frontend status.
- Update this task with implementation and verification results.

## Expected File Boundary

Implementation is expected to affect:

- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `apps/web/src/`
- Frontend TypeScript/Vitest configuration files where required.
- `.env.example`
- Root `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/quality.yml`
- `AGENTS.md`
- `docs/conventions/frontend-testability.md`
- Documentation listed in this task.

Equivalent feature-oriented file names are allowed. Backend source, Prisma
schema, migration, seed, and media files are not.

## Out of Scope

- Final catalog list layout or product card implementation.
- Final product detail page implementation.
- Search, filters, alternate sorting, or page-size controls.
- Cart actions or stock reservation behavior.
- Auth, roles, checkout, orders, or admin behavior.
- Backend API, CORS, DTO, schema, migration, or seed changes.
- Public Swagger/OpenAPI.
- `packages/shared`.
- React Hook Form.
- Axios.
- Redux, Zustand, or another general client-state library.
- MSW, Playwright, Storybook, or visual regression tooling.
- Playwright browser binaries, configuration, E2E tests, or `test:e2e`
  implementation.
- A UI kit, headless component library, icon library, CSS framework, or CSS
  preprocessor.
- Browser-language detection or locale persistence.
- Localized comic slugs.
- Service workers, offline caching, SSR, or React Server Components.
- Authentication headers, credentials, or token storage.
- ESLint, Prettier, repository-wide formatting, or unrelated quality-tool
  setup.
- Application containers or deployment configuration.
- Planned bugs, bug flags, registry entries, or spoiler content.
- Unrelated backend or frontend refactoring.

## Acceptance Criteria

- `/` redirects deterministically to `/en/comics`.
- `/en/comics`, `/ru/comics`, and localized slug-detail routes resolve through
  the approved route tree.
- Unsupported locale prefixes render the not-found state.
- The active route locale controls i18n, `<html lang>`, and API locale.
- Frontend API requests use same-origin `/api` paths and the development proxy.
- No hard-coded browser API host or browser-exposed secret is introduced.
- Catalog list and detail responses are runtime-validated before UI exposure.
- HTTP, network, cancellation, and contract failures have explicit typed
  behavior.
- TanStack Query owns catalog server state and uses locale-aware query keys.
- Request cancellation reaches `fetch`.
- Retry rules do not retry deterministic client errors.
- Error boundaries do not expose stack traces or raw server payloads.
- Shell and route states follow the frontend testability convention.
- Semantic roles and accessible names remain the primary locator strategy.
- Any added test IDs use stable lowercase kebab-case names, contain no database
  IDs or spoilers, and remain present in production output.
- Loading, error, not-found, locale, and navigation states are observable
  without fixed delays.
- Frontend routing, locale, API contract, and error tests pass.
- Frontend tests run in a separately named local and CI gate.
- Root `pnpm test` aggregates frontend and backend unit suites without being
  used as a duplicate CI gate.
- Explicit frontend, backend unit, and database-backed API CI gates pass.
- Existing backend unit and database-backed API behavior remains unchanged.
- Frontend and backend typechecks and builds remain passing.
- No final catalog UI, backend behavior change, shared package, UI kit, search,
  auth, planned bug, or unrelated refactor is added.

## Verification Plan

- Resolve and pin exact compatible versions for every approved dependency.
- Run `pnpm install --frozen-lockfile` after lockfile generation.
- Run `pnpm typecheck:web`.
- Run the new `pnpm test:web`.
- Run the new `pnpm test:unit:api`.
- Run aggregate `pnpm test`.
- Run `pnpm build:web`.
- Run `pnpm typecheck:api`.
- Run `pnpm test:api` against prepared PostgreSQL.
- Run `pnpm build:api`.
- Start the backend and frontend development servers.
- Verify `/`, EN/RU catalog routes, localized detail routes, unsupported
  locales, and direct browser navigation.
- Verify browser requests use the Vite `/api` proxy.
- Verify locale switching changes URL, UI language, document language, and API
  locale together.
- Verify a malformed API success response reaches the safe contract-error
  state.
- Verify no raw error details or browser secrets are rendered or bundled.
- Review rendered semantics and approved test IDs against
  `docs/conventions/frontend-testability.md`.
- Verify selector identity is unchanged between EN and RU.
- Verify loading, error, and not-found tests require no fixed delay.
- Run production frontend preview and verify localized client routes use
  history fallback correctly.
- Review CI workflow syntax and frontend test separation.
- Run `git diff --check`.
- Verify only approved files changed.

## Documentation Impact

- Update `README.md`.
- Update `PROGRESS.md`.
- Update `docs/architecture.md`.
- Update `docs/testing-strategy.md`.
- Update `docs/local-development.md`.
- Update `docs/product/catalog.md`.
- Add `docs/conventions/frontend-testability.md`.
- Update `AGENTS.md`.
- Update this task.

No public training documentation or closed bug guide content changes.

## API Contract Impact

No backend or public API behavior changes.

The frontend becomes a typed, runtime-validated consumer of
`docs/internal/api/catalog.md`. If implementation reveals an internal-contract
ambiguity, stop and propose a documentation amendment before changing API
behavior or assuming a new response shape.

## Seed Data Impact

None. Frontend behavior consumes the existing deterministic clean catalog seed.

## Test Impact

- Health tests: preserve existing backend health coverage.
- Clean core behavior tests: add frontend routing, locale, API boundary, and
  error-state coverage.
- Bug verification tests: none.
- Contract tests: add frontend runtime contract validation against documented
  DTO shapes.
- E2E tests: no Playwright implementation; establish the testability contract
  used by the first clean catalog smoke task after `0017`.
- Performance smoke tests: none.

## Bug Registry Impact

None. No planned defects, bug flags, or spoiler content are introduced.

## Dependencies

Proposed runtime dependencies:

- `react-router-dom`
- `@tanstack/react-query`
- `i18next`
- `react-i18next`
- `zod`

Proposed development dependencies:

- `vitest`
- `@testing-library/dom`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`

Existing React, Vite, TypeScript, pnpm, browser `fetch`, backend API, and Docker
Compose PostgreSQL are reused. No other dependency, tool, or service is
approved.

Approved exact runtime versions:

- `react-router-dom` `7.18.1`.
- `@tanstack/react-query` `5.101.4`.
- `i18next` `26.3.6`.
- `react-i18next` `17.0.11`.
- `zod` `4.4.3`.

Approved exact development versions:

- `vitest` `4.1.10`.
- `@testing-library/dom` `10.4.1`.
- `@testing-library/react` `16.3.2`.
- `@testing-library/jest-dom` `7.0.0`.
- `@testing-library/user-event` `14.6.1`.
- `jsdom` `29.1.1`.

Registry metadata confirms compatibility with the pinned React `19.2.8`, Vite
`8.1.5`, TypeScript `7.0.2`, and Node.js `22.13.0` baseline. TLS verification
must not be disabled during installation.

## Commit Decision

Approved by human project owner on 2026-07-24. Commit task 0016 separately.

## Implementation Notes

- Added localized React Router paths for EN/RU catalog list and slug-detail
  routes, deterministic root redirect, unsupported-locale not-found behavior,
  and route/application error boundaries.
- Added i18next and react-i18next with repository-owned EN/RU shell and route
  messages. Route locale controls UI language, document language, document
  title, navigation, and API locale.
- Added a same-origin `fetch` catalog client, frontend-owned strict Zod response
  schemas, typed HTTP/network/cancellation/contract errors, and no raw error
  rendering.
- Added TanStack Query list/detail options and hooks with locale-aware keys,
  cancellation forwarding, finite retry behavior, and no duplicate global
  server-state store.
- Added validated Vite development and preview proxy configuration using the
  root `VITE_API_PROXY_TARGET`; no API host is hard-coded in browser source.
- Added accessible shell, skip link, main region, language navigation, loading,
  error, ready, and not-found states. Stable test IDs are limited to approved
  automation surfaces and remain locale-independent.
- Added `docs/conventions/frontend-testability.md`.
- Added Vitest, Testing Library, jsdom, frontend contract/route/query/error
  tests, explicit root test commands, and a separate frontend CI gate.
- Updated architecture, catalog, testing, local development, README, progress,
  governance, and CI documentation.
- Added no Playwright dependency, browser binary, final catalog cards/detail
  layout, UI kit, backend behavior, schema, seed, planned bug, or unrelated
  refactor.

## Verification Results

- `pnpm install --frozen-lockfile`: passed with TLS verification enabled;
  Prisma Client postinstall generation passed.
- `pnpm typecheck:web`: passed.
- `pnpm test:web`: passed, 6 files and 19 tests.
- `pnpm build:web`: passed.
- `pnpm test`: passed as the aggregate gate, with 19 frontend tests and 7
  backend unit tests.
- `pnpm test:unit:api`: passed, 3 suites and 7 tests.
- `pnpm typecheck:api`: passed.
- `pnpm build:api`: passed.
- `pnpm test:api`: passed, 2 suites and 11 tests against prepared PostgreSQL.
- `pnpm db:validate`: passed.
- Docker Compose configuration validation passed.
- Local PostgreSQL remained healthy.
- Direct HTTP navigation to root, EN list, and RU detail paths returned the SPA
  shell.
- Vite same-origin proxy returned the seeded catalog: 8 published RU items and
  the EN detail response.
- Local integration used API port `3101` because port `3000` was occupied by a
  pre-existing health-only process; committed defaults were not changed.
- In-app browser visual verification was unavailable in this tool session.
  Route behavior, semantics, locale state, and observable UI states were
  verified through Testing Library and direct local HTTP smoke checks.
- Final diff, generated-output, whitespace, and scope checks are completed
  before the commit checkpoint.

## Risks and Open Questions

- Frontend-owned schemas duplicate part of the backend contract. This is
  intentional until shared ownership justifies a package and backend refactor.
- A same-origin production assumption requires a reverse proxy or equivalent
  host routing at deployment time. Deployment topology remains a later
  decision.
- Client-side localized routes require history fallback in the serving layer.
  Vite development and preview behavior must be verified now; deployment
  configuration remains later scope.
- React Query retry defaults are not suitable for every QA scenario. This task
  must make retry behavior explicit so deterministic errors are reproducible.
- A visible contract failure is preferable to silently treating malformed
  data as an empty catalog, but user-facing wording must remain concise and
  non-technical.
- Linting and formatting quality gates remain a separate explicit task. They
  should be added before the clean MVP is considered complete rather than
  being mixed into this feature foundation.
- Backend production-readiness is an ongoing requirement for each backend task;
  this frontend task does not authorize unrelated backend hardening.
- Stable test IDs create a compatibility surface. They should remain limited to
  identity that cannot be expressed reliably through accessible semantics.
- The first Playwright task follows `0017`; delaying it until Phase 8 would
  allow browser workflow regressions and selector drift to accumulate.
