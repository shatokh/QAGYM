# Task 0017: Catalog List and Product Detail UI

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-25 to implement task
  `0017` with all documented recommendations.
- Approved scope notes: Use no UI kit or new dependency; use six-item URL
  pagination; preserve the existing clean API boundary; keep Playwright in a
  separate follow-up task; implement the approved catalog testability
  contracts and responsive EN/RU behavior.

The approved decisions and scope are locked for implementation.

## Behavior Type

Clean Feature

The task replaces the frontend catalog placeholders with correct user-facing
list and detail behavior over the clean catalog API implemented in tasks `0015`
and `0016`.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Task `0016` established:

- localized `/en/comics` and `/ru/comics` routes;
- locale-preserving detail routes;
- frontend-owned Zod API contracts;
- centralized catalog clients and TanStack Query hooks;
- i18next resources;
- route loading, error, and not-found boundaries;
- Vitest and Testing Library;
- the semantic-first frontend testability convention.

The routes currently render readiness placeholders instead of products. The
clean seed already exposes eight published comics with:

- EN and RU content;
- series and standalone items;
- current and comparison prices;
- in-stock, low-quantity, and out-of-stock states;
- long titles and Unicode text;
- local cover media and one published null-cover fallback case;
- multiple creators and genres.

This task delivers the first complete browsable product experience. It must use
the existing clean API boundary and must not add cart, search, filters,
authentication, planned bugs, or Playwright.

Relevant references:

- `docs/tasks/0011-phase-1-catalog-foundation-plan.md`
- `docs/tasks/0015-catalog-read-api-and-internal-contract.md`
- `docs/tasks/0016-frontend-catalog-foundation.md`
- `docs/internal/api/catalog.md`
- `docs/product/catalog.md`
- `docs/product/catalog-seed.md`
- `docs/conventions/frontend-testability.md`
- `docs/testing-strategy.md`

## Unplanned Work Record

None.

## Goal

Create a responsive, localized, accessible catalog list and comic detail
experience that exposes the implemented clean seed scenarios and is ready for
the separately planned first Playwright smoke task.

## Proposed Review Decisions

### 1. UI Kit Boundary

Options:

1. Use focused project-owned React components and CSS with no UI kit.
2. Add a headless component library.
3. Add a full visual UI kit or CSS framework.

Recommendation: option 1.

Benefits:

- The slice needs only cards, metadata, pagination, status surfaces, and a
  detail layout.
- No new dependency or visual-system lock-in is needed.
- Accessibility remains explicit in project markup instead of being assumed
  from a library.
- A later forms-heavy task can reconsider shared primitives with real evidence.

### 2. Catalog Page Size

Options:

1. Use six products per page.
2. Keep the API default of twelve products per page.
3. Add a user-selectable page-size control.

Recommendation: option 1.

Benefits:

- The eight published clean seed items produce two real pages.
- Pagination is visible and manually testable in the local MVP.
- The value stays fixed and deterministic without adding a page-size setting.
- The API contract already supports explicit page sizes.

Option 3 is out of scope. The backend default remains unchanged.

### 3. Pagination URL Contract

Options:

1. Use `?page=<positive integer>` and canonicalize invalid values to page 1.
2. Keep page state only in React memory.
3. Pass invalid page values to the API and show a request error.

Recommendation: option 1.

Rules:

- Missing `page` means page 1 without requiring `?page=1`.
- Page 2 is `/:locale/comics?page=2`.
- Zero, negative, fractional, repeated, or non-numeric page values are replaced
  with the canonical page-1 URL.
- Locale switching preserves a valid page query.
- Page links use real destinations and support direct navigation.
- A page beyond the final page renders a distinct empty-page recovery state
  with a link to page 1.
- Search and filter query semantics remain deferred.

Benefits:

- Catalog state is shareable, reload-safe, and automation-friendly.
- Invalid URLs do not cause avoidable API errors.
- Future search and filter tasks can extend the query string.

### 4. Visible Catalog Card Content

Options:

1. Show the complete useful shopping summary without exposing internal data.
2. Show only cover and title.
3. Reproduce every detail field inside each card.

Recommendation: option 1.

Each card shows:

- cover image with localized meaningful alternative text;
- title;
- series title and issue number, or localized standalone label;
- creator names in API order;
- localized genre names;
- current price;
- comparison price when present, clearly identified as the previous price;
- exact available quantity or localized out-of-stock state.

Cards do not show database IDs, internal publication state, sort order, or
timestamps. SKU and description remain detail-page information.

### 5. Product Detail Content

Options:

1. Show every user-facing field available in the detail DTO.
2. Repeat the compact card only.
3. Add deferred commerce controls.

Recommendation: option 1.

The detail page shows:

- large cover or deterministic fallback;
- title;
- series and issue, or standalone label;
- creator names with localized writer/artist roles;
- genres;
- current and optional comparison price;
- exact stock quantity or out-of-stock state;
- SKU;
- localized description;
- a real link back to the localized catalog.

Do not render an Add to Cart control, disabled commerce placeholder, wishlist,
reviews, ratings, shipping information, or other unimplemented behavior.

### 6. Money and Availability Presentation

Options:

1. Format API minor-unit money with `Intl.NumberFormat` for the route locale and
   show exact stock information.
2. Display raw minor units and enum-like stock values.
3. Introduce a low-stock threshold and discount calculation.

Recommendation: option 1.

Rules:

- Keep money calculations based on integer minor units.
- Use the API currency code; the current clean seed is USD.
- EN and RU formatting may differ, but values must remain equivalent.
- Comparison price is display-only. Do not calculate a discount percentage.
- Quantity `0` is out of stock; positive quantity is shown explicitly.
- Do not invent a low-stock business threshold in this task.

### 7. Cover and Layout Stability

Options:

1. Use the real local cover path with the committed fallback for null cover
   values and stable 2:3 media dimensions.
2. Hide items without a cover.
3. Use remote placeholder media.

Recommendation: option 1.

Rules:

- Resolve API cover paths under the frontend public root.
- Use `/media/comics/cover-fallback.png` when `coverPath` is null.
- Card images use lazy loading; the main detail image may load eagerly.
- Reserve a 2:3 aspect ratio so loading and fallback do not shift the layout.
- Preserve readable long titles and prevent text or controls from overlapping.
- Use the actual seed covers; add no new generated or remote images.

### 8. Automation Surface

Options:

1. Keep semantic locators primary and add only the approved stable test IDs.
2. Add test IDs to every visual field.
3. Wait for Playwright before defining testability.

Recommendation: option 1.

Approved UI contracts for this task:

- `catalog-grid`
- `comic-card--<slug>`
- `pagination-previous`
- `pagination-next`
- `comic-detail--<slug>`
- existing `catalog-loading`, `catalog-error`, `comic-loading`,
  `comic-error`, and `comic-not-found` state IDs

Replace the temporary `catalog-ready` and `comic-ready` placeholder states with
the actual grid, empty state, and detail surface. Update their owning component
tests in the same task.

### 9. Playwright Boundary

Options:

1. Keep Playwright in a separate task immediately after 0017.
2. Install Playwright in this task.
3. Defer all browser automation until Phase 8.

Recommendation: option 1, matching the accepted task `0016` decision.

The next browser-automation task should use the completed clean list/detail
workflow. Task `0017` adds no Playwright package, browser binary,
configuration, test, or `test:e2e` command.

## Scope

### Catalog List

- Replace `CatalogListRoute` readiness output with the real catalog page.
- Read and canonicalize the `page` query parameter.
- Request six items per page through the existing catalog list hook.
- Render accessible loading, error with retry, empty catalog, empty requested
  page, and populated states.
- Render a semantic product list/grid with stable responsive dimensions.
- Add focused catalog components such as:
  - comic card;
  - cover;
  - price presentation;
  - stock presentation;
  - pagination.
- Link each card to `/:locale/comics/:slug`.
- Keep ordering exactly as returned by the API.
- Use real previous/next page links and expose current/total page status.
- Do not fetch data directly from components outside the existing query/client
  boundary.

### Product Detail

- Replace `ComicDetailRoute` readiness output with the real detail page.
- Preserve separate loading, API error, and comic-not-found behavior.
- Render all approved user-facing detail fields.
- Use the localized catalog return link.
- Update the document title to include the loaded comic title.
- Keep locale switching on the same slug.
- Preserve unpublished and unknown comic indistinguishability from the API.

### Localization and Formatting

- Replace temporary readiness copy with final catalog UI copy in EN and RU.
- Add localized labels for:
  - series issue and standalone;
  - writer and artist roles;
  - genres and creators sections;
  - current and previous prices;
  - stock quantity and out-of-stock state;
  - pagination;
  - empty catalog and empty requested page;
  - SKU and back navigation;
  - cover alternative text.
- Add small pure formatting helpers where they reduce duplication and are
  directly testable.
- Keep test IDs and route identity locale-independent.

### Styling

- Keep the existing application shell and refine it only where the real
  catalog layout requires.
- Add feature-local catalog styling or another comparably small project-owned
  CSS boundary.
- Use a restrained comics-retail visual direction driven by the actual cover
  art rather than decorative illustrations.
- Support at least:
  - wide desktop;
  - tablet;
  - 390 px mobile;
  - long EN and RU titles;
  - fallback cover;
  - keyboard focus and zoom without overlap.
- Keep repeated product cards at 8 px radius or less and do not nest cards.

### Tests

- Add or update frontend unit/component tests for:
  - valid, missing, and invalid page query behavior;
  - loading, API error, retry, empty catalog, and empty requested page;
  - populated grid and deterministic card order;
  - localized detail navigation and card links;
  - current and comparison money;
  - exact stock and out-of-stock rendering;
  - series/issue and standalone rendering;
  - creator roles and genres;
  - null cover fallback and meaningful image alt text;
  - long title rendering contract;
  - detail loading, success, API error, and not-found;
  - EN and RU copy and money formatting where behavior differs;
  - stable approved test IDs;
  - removal of temporary ready-placeholder assertions.
- Prefer role, accessible name, text, and image-alt queries before test IDs.
- Use mocked API/query boundaries only in component tests; do not add MSW.

### Documentation

- Update `docs/product/catalog.md` with the implemented frontend list/detail
  behavior and fixed page size.
- Update `docs/testing-strategy.md` only if the component-test boundary needs
  clarification.
- Update `PROGRESS.md` after implementation and verification.
- Keep public Swagger/OpenAPI and closed bug-guide documentation unchanged.

## Out of Scope

- Backend, Prisma, PostgreSQL, migration, seed, API contract, or DTO changes.
- Search, sort controls, filters, genre pages, creator pages, or series pages.
- Page-size selector or infinite scrolling.
- Cart, Add to Cart, checkout, orders, wishlists, reviews, ratings, or payment.
- Authentication, roles, demo accounts, or admin behavior.
- UI kit, CSS framework, icon library, form library, or another dependency.
- Playwright, browser downloads, E2E configuration, visual regression tooling,
  Storybook, or MSW.
- Remote media, new generated assets, media optimization pipeline, or CDN.
- Planned bugs, bug flags, bug registry entries, or closed guide content.
- Public Swagger/OpenAPI publication.
- Analytics, SEO metadata expansion, SSR, cache policy, or deployment behavior.
- Broad application-shell redesign unrelated to the catalog experience.

## Acceptance Criteria

- `/en/comics` and `/ru/comics` render the eight published seed items through
  two deterministic pages of six and two items.
- List and detail pages render only clean API data through the existing Zod and
  TanStack Query boundary.
- Card links, pagination links, locale switching, reload, and direct navigation
  preserve valid localized URL behavior.
- Invalid page values canonicalize to page 1 without issuing an invalid API
  request.
- Catalog loading, error, retry, empty catalog, empty requested page, and
  populated states are visibly and semantically distinct.
- Every card exposes the approved cover, title, series/standalone, creators,
  genres, money, and stock information.
- The detail page exposes every approved user-facing detail field and no
  deferred commerce control.
- Current and comparison prices are locale-formatted from integer minor units
  without discount calculation.
- Null cover values use the committed fallback without layout shift.
- Long EN/RU content fits without overlap at supported viewport widths.
- Keyboard navigation, focus visibility, heading order, image alternatives,
  status semantics, and real link destinations are usable.
- Test IDs match the approved stable contracts and contain no index,
  translation, database ID, planned bug, or spoiler data.
- Frontend component tests cover the clean behavior and observable state
  matrix.
- No dependency, backend, seed, API contract, Playwright, planned bug, or
  unrelated refactor is included.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `pnpm typecheck:web`.
- Run `pnpm test:web`.
- Run root `pnpm test`.
- Run `pnpm build:web`.
- Start the existing frontend and backend with the migrated deterministic clean
  seed.
- Verify direct EN and RU list/detail navigation against the real API.
- Verify page 1, page 2, invalid page canonicalization, out-of-stock,
  comparison-price, long-title, and fallback-cover scenarios.
- Inspect wide desktop, tablet, and 390 px mobile layouts with browser
  screenshots.
- Verify keyboard navigation, focus, zoom, no horizontal overflow, no text
  overlap, and nonblank local images.
- Inspect browser console and network failures.
- Run `git diff --check`.
- Inspect `git status --short` and ensure generated files, secrets, unrelated
  changes, and deferred dependencies are absent.

## Documentation Impact

- Create this task.
- Update `docs/product/catalog.md` during implementation.
- Update `PROGRESS.md` during planning and after verified implementation.
- Update `docs/testing-strategy.md` only if implementation reveals a needed
  component-test clarification within scope.

## API Contract Impact

None. The frontend must consume the implemented internal catalog API contract
without changing it.

Public Swagger/OpenAPI is unchanged.

## Seed Data Impact

None. The task consumes the existing deterministic clean catalog seed.

## Test Impact

- Health tests: None.
- Clean core behavior tests: Add frontend list/detail unit and component
  coverage.
- Bug verification tests: None.
- Contract tests: Existing frontend Zod contract and backend API tests remain
  unchanged.
- Performance smoke tests: None.

The task does not introduce Playwright E2E tests.

## Verification Results

- `node scripts/validate-task-governance.mjs` passed: 19 tasks and 2 proposals
  validated.
- `pnpm.cmd typecheck:web` passed.
- `pnpm.cmd test:web` passed: 8 files and 33 tests.
- `pnpm.cmd test` passed: 3 API suites with 7 tests and 8 web suites with 33
  tests.
- `pnpm.cmd build:web` passed with the Vite production build.
- `git diff --check` passed.
- Browser screenshot, keyboard, zoom, console, and real API checks remain
  deferred to the separate approved Playwright/browser verification task and
  require the local runtime to be started.

Implementation is ready for human review. The commit decision remains
separate and is still pending.

## Bug Registry Impact

None.

## Dependencies

No new dependencies, tools, services, or browser binaries.

Use the existing React, React Router, TanStack Query, i18next, Zod, Vitest,
Testing Library, Vite, and local catalog media.

## Commit Decision

Group with task 0020.

## Risks and Open Questions

- Six-item pages intentionally differ from the API default of twelve so the
  clean local seed exercises pagination.
- The current source images are large PNG files. A media optimization pipeline
  is out of scope; lazy loading and stable dimensions limit UI impact.
- Invalid-page canonicalization must avoid navigation loops and duplicate API
  requests.
- Component tests must not overfit translated copy or DOM structure.
- Search/filter tasks will later extend query semantics and must preserve the
  page URL contract deliberately.
- The first Playwright task should follow immediately after this UI task and
  use its stable automation surface.
