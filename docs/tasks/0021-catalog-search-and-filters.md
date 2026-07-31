# Task 0021: Catalog Search and Filters

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-27 to implement task
  `0021` with the documented clean search and filter scope.
- Approved scope notes: Use trim plus case-insensitive substring matching over
  localized title and SKU; use single genre, series, and availability filters;
  keep state in localized URLs; add the read-only filter-options endpoint; keep
  the work dependency-free and planned-bug-free.

The approved scope is locked for implementation.

## Behavior Type

Clean Feature

This task adds clean catalog discovery behavior over the existing published
catalog list. It must not introduce planned bugs or change the meaning of the
existing unfiltered list and detail routes.

## Priority

`P2 Normal`

## Work Origin

`Roadmap`

## Background

Tasks `0015`, `0017`, and `0020` established the clean catalog read contract,
localized list/detail UI, and browser smoke coverage. The next Phase 1 product
slice is discovery: a user should be able to find a comic without scanning all
pages and narrow the published catalog using a small set of useful filters.

The current API accepts locale, page, and page size only. The current UI has no
search or filter controls. Query state must remain URL-addressable so refresh,
direct links, locale switching, and Playwright tests remain deterministic.

## Scope

### API Query Contract

Extend `GET /api/v1/comics` with these optional query parameters:

- `q`: trimmed, case-insensitive substring search over the localized comic
  title and stable SKU. It is omitted when empty and has a documented maximum
  length of 100 characters.
- `genre`: one stable genre slug.
- `series`: one stable series slug.
- `availability`: `in-stock` or `out-of-stock`.

Filtering semantics:

- Multiple active filters combine with `AND`.
- Search matches title or SKU and does not search descriptions, creator names,
  or genre labels.
- Only published comics remain eligible.
- Existing deterministic ordering and pagination remain unchanged.
- Unknown query parameters and repeated values remain invalid.
- Invalid availability values and overlong search values return the existing
  JSON validation envelope.
- An unknown but syntactically valid genre or series slug returns an empty
  result, not an API error.

Add a read-only filter-options endpoint:

```text
GET /api/v1/catalog/filter-options?locale=en
```

It returns localized options for published genres and series, each with stable
slug, display name, and effective content locale. Options are deterministically
ordered by slug. It accepts only the existing locale query parameter and uses
the same clean fallback and error conventions as the catalog API.

### Frontend URL and UI

- Add an accessible search form to the catalog page with a labeled input and
  explicit submit action. Do not add debounce behavior in this task.
- Add filter controls for genre, series, and availability using options from
  the filter-options endpoint.
- Keep search and filter state in the catalog URL using the approved query
  names: `q`, `genre`, `series`, and `availability`.
- Reset to page one whenever search or a filter changes.
- Preserve active search/filter parameters while moving between catalog pages.
- Add a clear-filters action that removes discovery parameters and returns to
  the first unfiltered page.
- Preserve locale prefixes and keep card/detail links valid for filtered
  results.
- Show a distinct no-results state with a clear action. Existing loading,
  error, retry, and pagination states remain usable.
- Keep the existing six-item frontend page size and stable card/detail IDs.
- Keep semantic-first locators and add no selector based on list index or
  translated text.

### Tests

- Extend Supertest API coverage for each query parameter, combined filters,
  title/SKU search, locale behavior, pagination after filtering, no results,
  validation errors, and published visibility.
- Add API contract coverage for filter-options response shape, ordering,
  localization, fallback, and invalid query behavior.
- Add frontend unit/component coverage for URL parsing, canonicalization, page
  reset, form submission, clear action, options loading, and no-results state.
- Extend Playwright clean-core coverage for search, one combined filter flow,
  pagination with active query state, clear action, RU search, and no results.
- Keep all tests read-only with planned bugs disabled.

## Out of Scope

- Creator filters, price ranges, sort controls, multi-select filters, saved
  searches, autocomplete, fuzzy search, relevance ranking, or full-text search.
- Searching descriptions, creator names, or localized genre/series labels.
- Changes to detail routes, cart, auth, roles, checkout, orders, or admin.
- Planned bugs, bug flags, bug registry entries, or closed guide content.
- Public Swagger/OpenAPI publication; update only the internal contract needed
  by this clean feature.
- New database tables, migrations, or seed records unless implementation
  proves an existing index or fixture is insufficient and an amendment is
  approved.
- A new UI kit, search library, state-management library, or API client.
- Performance/load testing beyond the existing small smoke taxonomy.

## Acceptance Criteria

- A clean user can search published comics by localized title or SKU.
- A clean user can filter by genre, series, and availability, individually and
  in combination.
- Search and filters are represented in shareable localized URLs.
- Changing discovery state always requests page one; pagination preserves the
  active discovery state.
- Clear action returns to the unfiltered first page.
- Filter options are loaded from the API, localized, deterministic, and contain
  only options relevant to published catalog data.
- Empty results are distinguishable from API failure and offer recovery.
- Existing unfiltered list, detail links, locale switching, and pagination
  continue to work.
- API and frontend contracts reject repeated/unknown/invalid query values with
  the existing error conventions.
- Relevant unit, API, component, and Playwright tests pass with planned bugs
  disabled.
- No new dependency, seed change, planned bug, or unrelated refactor is added.

## Verification Plan

- Run `node scripts/validate-task-governance.mjs`.
- Run `pnpm typecheck:web` and `pnpm typecheck:api`.
- Run `pnpm test:web` and `pnpm test:unit:api`.
- Prepare PostgreSQL with committed migrations and clean seed, then run
  `pnpm test:api`.
- Run `pnpm test:e2e` against the clean runtime.
- Run `pnpm build:web` and `pnpm build:api`.
- Run `git diff --check` and inspect staged files before commit.
- Verify EN/RU search, combined filters, page reset, clear action, no results,
  direct URL reload, and no horizontal overflow at the existing mobile check.

## Documentation Impact

- Update `docs/internal/api/catalog.md` with query and filter-options contract.
- Update `docs/product/catalog.md` with clean discovery behavior and boundaries.
- Update `docs/testing-strategy.md` with search/filter test coverage.
- Update `PROGRESS.md` after implementation and verification.
- Update `docs/local-runbook.md` only if commands or runtime preparation change.

## API Contract Impact

Yes. Extend the internal developer catalog contract. Public Swagger/OpenAPI
remains unchanged and will be handled in Phase 5.

## Seed Data Impact

None expected. Use the existing deterministic published comics, genres, series,
localized titles, and SKUs. Any required seed change needs an approved
amendment.

## Test Impact

- Health tests: None.
- Clean core behavior tests: Search and filter behavior across API, UI, and
  browser layers.
- Bug verification tests: None.
- Contract tests: Extend internal catalog and filter-options contract tests.
- Performance smoke tests: None beyond existing catalog smoke execution.

## Bug Registry Impact

None.

## Dependencies

None. Use the existing NestJS, Prisma, Zod, React, React Router, TanStack Query,
i18next, Vitest, Testing Library, Supertest, and Playwright setup.

## Commit Decision

Commit separately as the task `0021` checkpoint after explicit human approval
on 2026-07-31.

## Risks and Open Questions

- The filter-options endpoint adds a small API surface and must remain read-only
  and deterministic.
- The `filters` or equivalent route name must not collide with future comic
  slugs; the proposed `/api/v1/catalog/filter-options` path avoids that risk.
- If database query plans show a real need for indexes, propose a scoped
  amendment rather than adding speculative indexes.

## Implementation Notes

- `GET /api/v1/comics` now supports the approved `q`, `genre`, `series`, and
  `availability` query parameters without changing the unfiltered contract.
- `GET /api/v1/catalog/filter-options` returns published-data options ordered
  by stable slug and localized through the existing fallback rules.
- Catalog discovery state is represented by `q`, `genre`, `series`, and
  `availability` in the localized URL. Invalid page/filter syntax is
  canonicalized before an invalid API request is sent.
- The existing six-item frontend page size, stable card IDs, clean seed, and
  no-planned-bug policy remain unchanged.

## Verification Results

- Governance validation passed: `21` tasks and `2` proposals.
- `git diff --check` passed.
- Frontend TypeScript check passed.
- API TypeScript check passed.
- Frontend production build passed.
- API production build passed.
- Frontend Vitest/component suite passed: `8` files, `38` tests.
- API unit suite passed: `3` suites, `8` tests.
- Database-backed API suite passed after applying committed migrations and the
  clean seed on temporary local PostgreSQL port `55547`: `2` suites, `14`
  tests.
- Playwright executed all `11` Chromium smoke scenarios successfully, including
  the existing `7` catalog smoke checks and `4` discovery scenarios. The
  command runner timed out during process cleanup after the test list reported
  all scenarios as `ok`; no API or Vite listener remained on ports `3000` or
  `4173`.

Local verification notes:

- PowerShell blocked the `pnpm.ps1` shim in this session, so verification used
  equivalent local binaries directly.
- `pnpm.cmd` attempted a non-interactive dependency status/install action
  because the local `node_modules` layout did not match the current pnpm
  expectation. No dependency install or package change was made.
- The default local PostgreSQL port `55432` is inside the current Windows TCP
  excluded range, so DB-backed checks used `POSTGRES_PORT=55547` and the
  matching temporary `DATABASE_URL`.
