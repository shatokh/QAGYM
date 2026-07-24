# ADR-0003: Clean Core and Bug Layer

## Status

Accepted

## Context

QA training products can become confusing when defects are random, undocumented, or mixed into normal behavior. QA Comics Gym needs educational bugs, but the platform itself must remain understandable and testable.

## Decision

Build clean behavior first and introduce planned bugs through a controlled bug layer.

Clean features and planned bugs must be separate tasks. Planned bugs must be registered before implementation.

## Consequences

- Clean core behavior can be tested with planned bugs disabled.
- Planned bugs can be verified intentionally.
- Public docs can describe normal behavior without leaking bug spoilers.
- The implementation needs a clear flag or scenario model for planned bugs.
- Tasks must prevent mixing feature work and planned bug work.
