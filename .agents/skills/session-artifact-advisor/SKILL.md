---
name: session-artifact-advisor
description: Incrementally analyze only unprocessed events from a long Codex session and propose durable repository artifacts such as AGENTS.md rules, skills, hooks, scripts, subagents, plugins, or MCP integrations. Use only when the human explicitly invokes $session-artifact-advisor to create a checkpoint, continue analysis after an earlier checkpoint, inspect repeated session friction, or update the advisor proposal registry. Never invoke implicitly and never implement a proposed artifact without a separately approved task.
---

# Session Artifact Advisor

Create an incremental checkpoint and convert recurring session evidence into
reviewable artifact proposals. Keep capture deterministic and analysis manual.

## Prepare the delta

1. Read the hook-provided developer context for exact `session_id`, `turn_id`,
   and repository root values.
2. Run:

   ```text
   node .agents/skills/session-artifact-advisor/scripts/session-advisor-state.mjs prepare --session "<session_id>" --turn "<turn_id>"
   ```

3. Read only the returned `delta_path`, the proposal index, and proposal files
   relevant to the new evidence. Do not reread earlier ledger events.
4. Treat `continuity.status: degraded` as a visible limitation. Never describe
   degraded coverage as exact.
5. If hook context is absent, use only currently visible conversation context
   as a manual bootstrap. State that pre-hook history and its exact cursor are
   unavailable. Do not invent session or turn identifiers.

## Handle the delta

- For `no_op: true`, do not update proposal files.
- For `bootstrap: true`, analyze visible context plus captured delta and label
  evidence as degraded bootstrap evidence.
- Exclude advisor trigger and advisor output turns; the state script already
  filters captured internal events.
- If the previous repository baseline differs, inspect only changed paths
  relevant to an observation or open proposal. Do not perform an unconditional
  full-repository audit.

Look for:

- repeated human corrections or preferences;
- recurring setup, review, verification, or recovery steps;
- repeated command or file-discovery friction;
- durable decisions missing from project guidance;
- deterministic policies that need enforcement;
- specialized analysis that benefits from context isolation;
- workflows that require external data or distribution.

Do not turn a one-off preference into a durable artifact unless its impact is
high and the evidence is explicit.

## Select the artifact surface

Use the smallest surface that fits:

- `AGENTS.md`: short repository convention that should apply broadly.
- Skill: reusable semantic workflow with instructions or helper scripts.
- Hook: deterministic lifecycle capture or enforcement.
- Script: deterministic transformation, validation, hashing, or state handling.
- Subagent: specialized noisy analysis that benefits from isolated context.
- Plugin: reusable distribution bundle across repositories or teams.
- MCP: live external context or actions unavailable in the repository.

Read `docs/ai/session-advisor/artifact-selection.md` before creating a new
proposal type or when the correct surface is ambiguous.

## Update proposals

1. Read `docs/ai/session-advisor/proposal-schema.md`.
2. Derive a stable deduplication key from the underlying recurring need, not
   from wording in one message.
3. Search `docs/ai/session-advisor/proposals/index.md` and existing proposal
   files for that key.
4. Update matching evidence instead of creating a duplicate.
5. Create a new proposal only when evidence meets the rubric.
6. Use checkpoint ID `cp-<first 16 characters of run_id>` for exact runs. Mark
   manual bootstrap evidence explicitly when no run ID exists.
7. Keep every proposal in `candidate` state unless the human explicitly chooses
   another state.
8. Do not implement the proposal. Repository task governance still applies.

## Complete the checkpoint

After all proposal files and the index are successfully updated, run:

```text
node .agents/skills/session-artifact-advisor/scripts/session-advisor-state.mjs ready --session "<session_id>" --turn "<turn_id>" --proposals "<comma-separated-proposal-ids>"
```

For a no-op, omit `--proposals`. The `Stop` hook finalizes the cursor after the
advisor response is captured.

If `ready` fails, report the failure and do not claim that the checkpoint
advanced. A later invocation can safely retry or recover the pending run.

## Report

Return:

- checkpoint status and continuity;
- exact new event count;
- created or updated proposal IDs;
- rejected observations and the reason they did not justify an artifact;
- whether a later approved task is needed.

Keep raw captured content and secrets out of the response and tracked files.
