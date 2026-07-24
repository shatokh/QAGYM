# Session Artifact Advisor

Session Artifact Advisor preserves a lightweight local record of Codex session
turns and performs semantic analysis only when the human explicitly invokes
`$session-artifact-advisor`.

The design separates two workloads:

1. Lifecycle hooks capture redacted user prompts, final assistant messages, and
   lifecycle boundaries without calling a model.
2. The repository skill loads only events after the last successful checkpoint
   and proposes durable artifacts.

The target cost is proportional to new events plus compact proposal state, not
the full historical session.

## Activation

Project-local hooks require a trusted repository and may require a new or
resumed Codex session after `.codex/hooks.json` becomes available.

Invoke the analyzer explicitly:

```text
$session-artifact-advisor
```

The trigger hook supplies the exact Codex `session_id` and `turn_id` to the
skill. The skill must not guess the newest session file.

If hooks are not active, the advisor may perform a manual bootstrap from
currently visible context, but it must report degraded continuity. It cannot
reconstruct content already removed by compaction.

## Operational State

Runtime files live under `.session-advisor/` and are ignored by Git:

```text
.session-advisor/
  sessions/
    <safe-session-id>/
      events.jsonl
      meta.json
      checkpoint.json
      runs/
```

Each event includes a monotonic sequence and a hash of the previous event.
Checkpoint preparation validates the full chain using local CPU but sends only
the unprocessed range to the semantic analyzer.

A run progresses through:

```text
prepared -> ready -> finalized
```

The skill marks a run `ready` only after tracked proposal updates succeed. The
`Stop` hook then captures the advisor response and atomically advances the
covered cursor. A prepared run that never becomes ready cannot silently advance
the checkpoint.

## Privacy

The capture script applies best-effort redaction for common API keys, bearer
tokens, passwords, private keys, and credential-bearing URLs. This is not a
proof that arbitrary secrets are absent.

Therefore:

- runtime state remains local and gitignored;
- tool inputs, tool outputs, environment variables, and hidden model reasoning
  are not captured;
- proposal documents contain summarized evidence, not raw chat;
- captured state can be removed explicitly.

Purge one session:

```text
node .agents/skills/session-artifact-advisor/scripts/session-advisor-state.mjs purge --session "<session_id>"
```

Purge all advisor runtime state:

```text
node .agents/skills/session-artifact-advisor/scripts/session-advisor-state.mjs purge --all
```

## Recovery

Validate a session ledger:

```text
node .agents/skills/session-artifact-advisor/scripts/session-advisor-state.mjs validate --session "<session_id>"
```

Recover a run that reached `ready` but whose Stop finalization was interrupted:

```text
node .agents/skills/session-artifact-advisor/scripts/session-advisor-state.mjs recover --session "<session_id>"
```

Broken hashes, missing pre-hook history, or unavailable event data produce
`continuity.status: degraded`. The advisor may still offer explicitly qualified
observations, but it must not claim exact incremental coverage.

## Governance

An explicit advisor invocation may update only:

- local `.session-advisor/` state;
- this advisor documentation;
- `docs/ai/session-advisor/proposals/`.

Creating or implementing the recommended rule, skill, hook, script, subagent,
plugin, MCP integration, or product change requires the normal task lifecycle.
