# Project Brief

## Vision

QA Comics Gym is a local-first training sandbox where QA engineers can practice realistic testing work against a dummy comics e-commerce product. The project should feel like a small real product, not a puzzle site or a randomly broken demo.

The main principle is to build a correct clean core first, then add planned educational bugs through a controlled bug layer.

## Target Audience

The product is for a mixed QA audience:

- Beginners practicing exploratory testing, checklists, test cases, and bug reports.
- Manual testers learning web and API testing habits.
- Automation testers practicing UI, API, integration, and smoke test design.
- Security-oriented testers practicing safe vulnerability discovery in a controlled environment.
- QA leads and mentors preparing training sessions.

## Product Concept

The product is a dummy comics e-commerce store. Users can browse comics, view product details, authenticate, use a cart, place checkout orders without real payment, and review order history. Admin users can manage basic catalog and order scenarios.

The store will include public training documentation, public Swagger/OpenAPI documentation, an internal developer API contract, seeded demo data, demo accounts, and a repository-backed bug registry.

## MVP Scope

The MVP should eventually include:

- One dummy comics store.
- Guest, user, and admin scenarios.
- Catalog.
- Product details.
- Authentication.
- Cart.
- Checkout without real payment.
- Minimum checkout address for order scenarios.
- Order history.
- Basic admin area.
- Demo accounts.
- Seeded scenarios.
- Display-only discounted seed item, without promocodes.
- Public documentation area.
- Bug registry.
- Controlled bug flags.
- Internal test taxonomy.

## MVP Non-Goals

The MVP should not include:

- Gamification.
- User progress tracking.
- Auto-grading.
- Mentor review workflows.
- Built-in bug tracker.
- Challenge builder.
- Real payments.
- Real email.
- Full profile editing.
- Promocodes or full discount engine.
- Multi-tenant SaaS architecture.
- Redis or queues.
- Production-grade observability.

## Technology Direction

Technology direction and current selections:

- React, Vite, and TypeScript for the frontend.
- NestJS and TypeScript for the backend.
- PostgreSQL for the database.
- Prisma as ORM.
- Docker Compose for local runtime.
- pnpm workspaces preferred.
- No Turborepo or Nx at the start.
- Zod as the preferred backend DTO validation approach.
- Playwright, Jest or Vitest, Supertest, and k6 for planned test coverage.

The platform foundation now exists: pnpm workspaces, React/Vite and NestJS
application skeletons, Prisma configuration, a Docker Compose PostgreSQL
runtime, and baseline CI quality gates. Product models, migrations, seed data,
catalog behavior, API contracts, and automated product tests are not yet
implemented.

## Catalog Foundation Direction

The clean catalog should start with these accepted data directions:

- Store localized catalog text in normalized translation records so RU and EN
  content do not require fixed language columns.
- Store money as integer minor units with an ISO currency code.
- Support an optional comparison price for display-only discounted items
  without introducing promocodes or a discount engine.
- Use stable local cover assets for clean scenarios.
- Treat a missing cover as a supported clean state with a deterministic
  fallback. Broken media behavior belongs to a future registered planned bug.

The approved foundation normalizes creators, genres, series, and translations.
Catalog entities use integer internal IDs plus stable slugs and comic SKUs.
Public reads expose only published comics, and the first read slice is
paginated list plus slug detail. Search and filters follow as separate Phase 1
features.

Exact Prisma types, lengths, indexes, pagination shape, locale transport,
errors, search semantics, and filter syntax remain implementation-contract
decisions.

## Clean Core + Bug Layer

QA Comics Gym must not be a randomly broken store. Clean product behavior is
implemented first and covered by relevant tests. Internal behavior contracts
and clean tests should evolve with each feature rather than being deferred to a
later automation phase. Planned educational bugs are introduced later through a
controlled bug layer.

Clean features and planned bugs must be separate tasks. The clean application
should work before planned bugs are introduced. Planned bugs must be registered
before implementation, start as flag-controlled behavior disabled by default,
and must not break platform health.

## Public Docs vs Closed Bug Guide

Public docs should explain the product, available training surface, accounts, API usage, and safe testing boundaries. Public docs must not leak spoiler-level details about planned bugs.

The closed bug guide will be visible only to privileged credentials or roles. It can describe planned bugs, expected discovery paths, hints, and verification guidance.

Application access control does not make repository-backed registry files
secret from repository readers. Repository visibility and the spoiler threat
model must be decided before public source publication or a public demo.

## Public Training Swagger vs Internal API Contract

The public Swagger/OpenAPI documentation is a training artifact for QA users. It should expose the API surface intended for practice.

The internal developer API contract is a development artifact. It should describe expected behavior, validation rules, error models, and implementation-facing API details. Public training docs and internal contracts may overlap, but they have different audiences.

Internal contracts should evolve with the features they specify. The later
documentation phase publishes and consolidates them rather than introducing
them only after APIs are implemented.

## Safe Security Simulation

Security bugs must be safe simulations only. They must not require attacking real services, leaking real secrets, sending real email, processing real payments, or enabling harmful behavior outside the local training environment.

## Local-First Development

The frontend and backend skeletons already run locally, and Docker Compose
provides PostgreSQL. Product migrations, deterministic seed data, database
integration, and product test commands will be added through later approved
tasks.

## RU/EN Readiness

Repository documentation is currently written in English. The product
structure should remain ready for Russian and English content, including UI
copy, public docs, training materials, bug guide content, and normalized
catalog translations.
