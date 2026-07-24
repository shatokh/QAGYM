# ADR-0002: PostgreSQL and Prisma

## Status

Accepted

## Context

The product needs realistic e-commerce data: users, roles, comics, carts, orders, and seeded training scenarios. The database should be familiar to QA engineers and suitable for API, data, and automation practice.

## Decision

Use PostgreSQL as the database and Prisma as the ORM.

## Consequences

- The data model can support realistic relational scenarios.
- Prisma migrations and seed data can provide repeatable local states.
- QA users can practice against a common database style.
- The project must keep Prisma schema, migrations, seed data, API behavior, and docs consistent.
