# Bug Strategy

## Planned Bugs

A planned bug is an intentional educational defect. It exists to teach QA investigation, test design, automation, API testing, accessibility checks, performance awareness, localization checks, mobile checks, reliability thinking, or safe security discovery.

Planned bugs must have registry entries before implementation.

The clean application should be built and verified before planned bugs are implemented. Bug flags can be considered during architecture planning, but planned bug behavior should not be mixed into clean feature tasks.

## Accidental Bugs

An accidental bug is unintended behavior that conflicts with the clean core, docs, API contracts, tests, seed data, or a planned bug specification.

Accidental bugs are fixed through bugfix tasks. They should not be retroactively treated as planned bugs unless a separate approved planned bug task is created.

## Bug Registry

The bug registry is the source of truth for planned bugs. Each planned bug needs a stable ID and metadata. The registry lives in repository files under `bug-registry/`.

## Categories

Planned bug categories:

- Functional.
- API.
- Security.
- Accessibility.
- Performance.
- Localization.
- Mobile.
- Reliability.

Do not add a separate UX category at the start. UX-oriented defects should be classified under the closest existing category and marked with metadata such as `surface: UX`.

## Difficulty Levels

Use levels L1-L5:

- L1: Easy to find with basic manual testing.
- L2: Requires focused exploratory testing or simple API checks.
- L3: Requires deeper scenario coverage or automation thinking.
- L4: Requires cross-feature, edge-case, or non-functional investigation.
- L5: Advanced scenario requiring careful analysis, security awareness, or performance reasoning.

## Always-On vs Flag-Controlled Bugs

Planned bugs can be:

- Always-on: Present in a specific seeded training scenario.
- Flag-controlled: Enabled or disabled through configuration or scenario flags.

The first planned bugs should be flag-controlled. Always-on bugs or a default-on training pack can be selected later after the clean app, bug layer, and verification strategy are stable.

## Safe Security Simulations

Security bugs must be safe simulations only. They must not expose real secrets, process real payments, attack real services, send real email, or teach harmful actions outside the local training context.

Security simulations should be scoped, documented, and reversible.

## Public Docs and Closed Bug Guide

Public docs can describe safe testing boundaries, available scenarios, and training goals. They must not leak spoiler details for planned bugs.

The closed bug guide should use a hybrid model: registry files are the source of truth, and guide pages manually add hints, discovery paths, mentor notes, and verification context. Access to the closed guide should be restricted by privileged credentials or role in future implementation.
