# Artifact Selection

Choose the smallest durable surface that solves the observed recurring need.

## Evidence Threshold

Create a proposal when at least one condition holds:

- the same correction or workflow appears in two or more independent turns;
- an explicit human decision should persist across sessions;
- deterministic enforcement would prevent a high-impact failure;
- repeated discovery or setup consumes material time or context;
- the human explicitly asks to preserve the behavior as an artifact.

Otherwise record the observation only in the advisor response and reject it as
insufficiently durable.

## Surface Rubric

### AGENTS.md

Use for a short repository-wide convention, command, verification expectation,
or routing instruction that should apply before normal work begins.

Do not use for a long procedure, examples, scripts, or one session's temporary
preference.

### Skill

Use for a reusable semantic workflow that benefits from richer instructions,
references, examples, or deterministic helper scripts.

Do not use merely to restate a one-line repository rule.

### Hook

Use for deterministic work at a documented Codex lifecycle event, especially
capture, validation, policy enforcement, or context injection.

Do not use a hook for expensive semantic analysis or an action that should
require a human trigger.

### Script

Use for deterministic parsing, hashing, transformation, validation, state
management, or repetitive command composition.

Do not use a script when judgment over repository or conversation meaning is
the core requirement.

### Subagent

Use when specialized analysis is noisy, parallelizable, and benefits from an
isolated context and explicit input/output contract.

Do not create a role when the main agent can follow a concise skill directly.

### Plugin

Use when the workflow must be installed or distributed across repositories,
users, or teams, potentially with several skills, hooks, or tool dependencies.

Do not package a repository-only experiment prematurely.

### MCP

Use when the workflow requires live external context or actions that cannot be
provided safely and maintainably through repository files or local scripts.

Do not use MCP as storage for information that naturally belongs in the
repository.

## Proposal Quality

Every proposal must explain:

- why the need is recurring or high impact;
- why the selected surface is the smallest suitable one;
- what existing surface was considered first;
- expected benefit;
- maintenance and security cost;
- evidence and confidence.
