# ADR-0005: Public and Internal API Docs

## Status

Accepted

## Context

The project needs API documentation for two audiences. QA trainees need a public training API surface for practice. Developers and Codex need an internal contract that describes expected behavior, validation, errors, and implementation details.

These documents overlap, but they should not be treated as the same artifact.

## Decision

Use public training API docs and a separate internal developer API contract.

## Consequences

- Public Swagger/OpenAPI can focus on training usage.
- Internal contracts can define implementation expectations more precisely.
- API behavior changes must consider both public docs and internal contracts.
- Public docs must not expose closed bug guide details.
- Keeping the two documentation layers consistent will require explicit task checks.
