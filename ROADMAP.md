# Roadmap

Across product phases, internal behavior/API contracts, deterministic seed
scenarios, and relevant clean tests evolve with the features they specify.
Phase 5 publishes documentation, and Phase 8 expands automation breadth; those
phases do not defer the first contract or test work.

## Phase 0 - Documentation and Governance Foundation

Goal: Establish project governance, working rules, architecture direction, and
documentation structure before application setup begins.

Main deliverables:

- Project brief, roadmap, progress tracker, and agent instructions.
- Ways of working, architecture, testing, bug strategy, and local development docs.
- Initial ADRs.
- Bug registry folder structure.

Out of scope:

- Application code.
- Package manager initialization.
- Dependency installation.
- Runtime infrastructure.

Acceptance signal: Future work has clear rules, accepted decisions, and a place
to write tasks before implementation starts.

## Phase 1 - Clean Comics Store Core

Goal: Build the first clean product behavior for the comics store without planned bugs.

Main deliverables:

- Initial frontend, backend, database, local runtime, and CI foundation.
- First comics catalog domain model and migration.
- Minimal deterministic clean catalog seed and repeatable reset path.
- Internal catalog behavior and API contracts maintained with implementation.
- Clean catalog and product detail behavior with relevant tests.
- Basic shared types where useful.
- Platform and catalog health checks.

Out of scope:

- Planned bugs.
- Authentication, roles, and demo accounts.
- Admin area.
- Checkout and orders.
- Public documentation publication.

Acceptance signal: A new local environment can apply the catalog migration,
load deterministic clean catalog data, and browse catalog and product details
through the application. Relevant health and clean behavior tests pass, and no
planned bug is implemented.

## Phase 2 - Auth, Roles and Seeded Demo Scenarios

Goal: Add authentication, role handling, demo accounts, and seeded data for guest, user, and admin scenarios.

Main deliverables:

- Auth flow.
- Role model.
- Demo accounts.
- Seeded users and role-specific scenarios.
- Expansion of the Phase 1 catalog seed where auth scenarios require it.
- Repeatable reset behavior for account and role scenarios.

Out of scope:

- Real email.
- External identity providers.
- Production-grade auth hardening.

Acceptance signal: Guest, user, and admin scenarios can be exercised with documented demo accounts.

## Phase 3 - Cart, Checkout and Orders

Goal: Add core shopping workflow without real payment.

Main deliverables:

- Cart behavior.
- Checkout without real payment.
- Minimum checkout address for order scenarios.
- Order creation.
- Order history.

Out of scope:

- Real payment providers.
- Real invoicing.
- Real shipment integrations.

Acceptance signal: A seeded user can add comics to a cart, check out, and view order history.

## Phase 4 - Admin Area

Goal: Add basic admin workflows for training scenarios.

Main deliverables:

- Basic admin UI.
- Catalog management scenarios.
- Order review scenarios.
- Admin-only access handling.

Out of scope:

- Advanced CMS features.
- Full inventory management.
- Multi-admin audit workflows.

Acceptance signal: Admin users can access basic admin workflows while non-admin users cannot.

## Phase 5 - Public Docs and API Contract Publication

Goal: Publish training-facing docs and consolidate the internal contracts that
have evolved with clean feature implementation.

Main deliverables:

- Public documentation area.
- Public training Swagger/OpenAPI.
- Consolidated repository-backed internal developer API contract.
- API behavior documentation rules.
- Contract consistency checks for implemented clean APIs.

Out of scope:

- Bug spoilers in public docs.
- Auto-generated challenge flows.

Acceptance signal: Public and internal API documentation are separated,
published in their intended forms, and consistent with implemented clean
behavior. Internal contracts already used by earlier features remain the clean
source of expected behavior.

## Phase 6 - Bug Registry and Bug Flag System

Goal: Create the controlled bug layer and registry workflow.

Main deliverables:

- Bug registry entry format.
- Bug ID rules.
- Bug flag model.
- Closed bug guide structure.
- Registry-to-guide synchronization and spoiler boundary rules.

Out of scope:

- Large planned bug pack.
- Public spoiler content.

Acceptance signal: Planned bugs can be registered, flagged, enabled, disabled, and documented without changing clean core expectations.

## Phase 7 - Planned Bugs Pack 1

Goal: Add the first small set of planned educational bugs.

Main deliverables:

- 5-10 registered planned bugs across selected categories.
- Bug implementation tasks.
- Bug verification tests.
- Closed guide entries.
- Flag-controlled behavior for the initial bug pack.

Out of scope:

- Random breakage.
- Unsafe security behavior.
- Broad refactors.

Acceptance signal: Each planned bug has a registry entry, implementation, verification path, flag behavior, and no platform health regression.

## Phase 8 - Automation Readiness

Goal: Expand the existing feature-level test foundation into a stable,
documented automation practice surface.

Main deliverables:

- Stable selectors and API fixtures.
- Expanded Playwright E2E coverage.
- Expanded Supertest API coverage.
- Expanded Jest or Vitest coverage.
- k6 smoke tests.
- Mature CI command structure for the supported test taxonomy.

Out of scope:

- Auto-grading.
- Hosted runner infrastructure.

Acceptance signal: QA users can build automation suites against stable local
scenarios, while project CI clearly separates health, clean core, contract, bug
verification, and performance smoke intent where those suites exist.

## Phase 9 - Local Demo Polish and Deployment Preparation

Goal: Improve local demo quality and prepare for optional deployment.

Main deliverables:

- Local demo polish.
- End-to-end onboarding and reset workflow validation.
- Deployment notes.
- Documentation cleanup.

Out of scope:

- Production-grade observability.
- Multi-tenant hosting.
- Real payment or email integrations.

Acceptance signal: A new user can run the local demo, follow docs, and understand optional deployment steps.
