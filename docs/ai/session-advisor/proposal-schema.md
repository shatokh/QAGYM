# Artifact Proposal Schema

Store each proposal as
`docs/ai/session-advisor/proposals/<proposal-id>.md`.

Use lowercase stable IDs:

```text
saa-<surface>-<need-slug>
```

The deduplication key describes the underlying need and must remain stable when
message wording changes.

## Required Template

```markdown
# <Proposal title>

## Metadata

- Proposal ID: `<stable-id>`
- Deduplication key: `<stable-need-key>`
- Status: `candidate|accepted|rejected|superseded|implemented`
- Surface: `AGENTS.md|skill|hook|script|subagent|plugin|MCP`
- Confidence: `low|medium|high`
- Recurrence: `<count and scope>`

## Problem

<Recurring need or high-impact failure mode.>

## Proposed Artifact

<Smallest artifact that addresses the problem.>

## Evidence

- `<checkpoint-id>`: <summary without raw chat or secrets>

## Expected Benefit

<Saved context, reduced errors, enforcement, or reuse.>

## Maintenance Cost

<Ownership, compatibility, security, and update burden.>

## Alternatives Considered

<Why an existing or smaller surface is insufficient.>

## Next Decision

<Human decision or separately approved task required.>
```

## Lifecycle

- `candidate`: proposed by the advisor and awaiting human decision.
- `accepted`: human agrees with the recommendation; implementation still needs
  an approved task unless an existing approved task already owns it.
- `rejected`: human declines it or evidence is no longer sufficient.
- `superseded`: another proposal replaces it.
- `implemented`: an approved task delivered and verified the artifact.

Updating evidence must not reset a human-selected status.
