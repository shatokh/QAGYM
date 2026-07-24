# Frontend Testability Convention

## Purpose

This convention defines the frontend contract needed for stable component and
future Playwright E2E tests. It applies to clean features and planned bug
surfaces.

Testability is part of feature design. It must not be added later as a blanket
set of selectors after the UI is complete.

## Locator Priority

Frontend markup should support locators in this order:

1. Accessible role and name for interactive elements.
2. Associated label for form controls.
3. Alternative text for meaningful images.
4. Visible text when the text itself is the behavior under test.
5. `data-testid` for stable identity that is not reliably expressed through a
   user-facing locator.

Use real semantic elements such as `button`, `a`, `input`, `main`, `nav`, and
headings. Do not add a test ID to compensate for incorrect semantics.

Tests must not depend on:

- Styling classes.
- Generated CSS names.
- XPath.
- Deep DOM structure.
- Child position or array index.
- React component names or implementation details.

## Test ID Rules

The project uses the standard `data-testid` attribute. Test IDs are a deliberate
automation contract, not a styling hook or application logic input.

Use lowercase kebab-case names:

```text
app-shell
locale-switcher
catalog-grid
catalog-loading
catalog-error
route-not-found
pagination-next
comic-card--neon-harbor-1
```

Rules:

- Add test IDs only where semantic locators are ambiguous, unstable across
  locales, or insufficient for repeated domain entities.
- Use stable public identity such as a slug or SKU for an entity-specific test
  ID.
- Do not use database IDs, list indexes, random values, timestamps, or
  translated labels.
- Do not encode planned bug IDs, flag names, hints, credentials, or spoiler
  information.
- Keep test IDs in production builds. They are non-secret automation surfaces
  for this QA training product.
- Do not remove or rename a used test ID without updating its owning task,
  tests, and relevant documentation.
- Do not select application behavior by reading `data-testid`.

Repeated structures may use one shared structural ID when tests can narrow the
result semantically. Use an entity-specific ID only when stable direct identity
is useful for training or automation.

## Observable UI States

Asynchronous and route-level states must be observable without fixed delays:

- Loading regions expose a status and appropriate `aria-busy` state.
- Errors expose a concise accessible alert.
- Empty results have a distinct visible empty state.
- Not-found behavior is distinct from unexpected failure behavior.
- Disabled controls use real disabled semantics where applicable.
- Links expose real destinations and support direct navigation.
- The active navigation or locale control exposes current-state semantics.

Tests should wait on these states through retrying assertions. Product code must
not add artificial sleeps for test synchronization.

## Localization

General workflow tests should not depend on one translated label when a stable
role or test ID expresses the same target. Localization tests should explicitly
assert the expected EN and RU text.

The route locale, UI locale, document language, and API locale must remain
observable and synchronized. Test IDs stay locale-independent.

## Accessibility and Navigation

The application shell and feature pages should provide:

- One clear main-content region.
- A usable skip-to-content target.
- Logical heading structure.
- Keyboard-operable controls.
- Visible focus.
- Meaningful image alternative text.
- Route-aware document title and language.

Accessibility is part of the user-facing contract and is the preferred source
of stable Playwright locators.

## E2E Environment

Clean Playwright E2E tests should:

- Run against the real frontend, backend, migrated database, and deterministic
  seed.
- Run with planned bug flags disabled.
- Use stable slugs, SKUs, and documented demo identities instead of generated
  database IDs.
- Avoid mocking the main clean happy path.
- Use request interception only for focused loading, error, or resilience
  scenarios that cannot be produced safely through the clean fixture.
- Avoid shared mutable state between parallel tests.

Future write workflows need an explicit reset or isolation strategy. Authenticated
tests that mutate state should use isolated accounts per worker or another
approved equivalent.

Clean core E2E and planned bug verification E2E must remain separately named and
must not rely on an implicit bug mode.

## Playwright Introduction

Do not install Playwright merely to reserve selectors. Introduce it through a
separate approved task when the first complete browser workflow exists.

The initial Playwright task should define:

- `pnpm test:e2e`.
- A repository-owned `baseURL`.
- Managed frontend and backend web servers.
- Deterministic database migration and seed preparation.
- Explicit clean bug mode.
- `forbidOnly` in CI.
- Bounded CI retries that report, rather than hide, flaky behavior.
- Trace capture on first retry.
- Failure screenshots and useful retained artifacts.
- An initial browser project and the later browser-matrix boundary.

Tests should use Playwright locators, auto-waiting, and retrying assertions.
Fixed `waitForTimeout` calls are not an accepted synchronization strategy.

## Feature Review Checklist

Frontend feature tasks should verify:

- Interactive controls have correct roles and accessible names.
- Stable automation targets exist only where semantic locators are insufficient.
- Dynamic entity selectors use stable public identity.
- Loading, empty, error, disabled, and not-found states are observable.
- EN/RU behavior does not change selector identity.
- Test IDs contain no secrets or planned bug spoilers.
- Existing automation contracts are not renamed accidentally.
- Component tests and future E2E tests can exercise behavior without DOM
  structure selectors or arbitrary waits.
