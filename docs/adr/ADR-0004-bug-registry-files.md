# ADR-0004: Bug Registry Files

## Status

Accepted

## Context

Planned bugs need stable IDs, categories, difficulty levels, spoiler boundaries, and verification notes. The registry should be reviewable before implementation and should work before the application database exists.

## Decision

Store the planned bug registry as repository files under `bug-registry/`. Initial entries may use Markdown/MDX or YAML/JSON style. Do not store the initial planned bug registry in the database.

## Consequences

- Planned bugs can be reviewed in pull requests.
- Registry entries can exist before runtime code.
- The registry stays close to task documents, docs, and tests.
- Future tooling may parse the registry if the format stabilizes.
- If the product later needs a runtime bug guide sourced from registry data, generation can be proposed as a separate task.
