# Task 0018: Session Artifact Advisor Foundation

## Status

Done

## Approval Record

- Approved by: Human project owner.
- Approval reference: Conversation approval on 2026-07-24: the owner accepted
  the reviewed hybrid design and instructed Codex to start it in parallel with
  task `0016`.
- Approved scope notes: Implement a repository skill, lightweight Codex
  lifecycle capture hooks, a local gitignored event ledger, incremental and
  transactional checkpoints, and a durable artifact proposal registry. Use no
  new package dependency, do not change product behavior, and isolate the work
  from the active task `0016`.

The approved decisions and scope are locked for implementation.

## Behavior Type

Infrastructure

The task adds repository-local Codex workflow automation and operational state.
It does not introduce or change QA Comics Gym product behavior.

## Background

The project owner regularly uses long, context-heavy Codex sessions. Useful
session outcomes currently remain distributed across chat context, task files,
and implementation diffs. Re-reading an entire continued session to discover
recurring guidance is expensive, and early unprocessed context may be compacted
before a manually triggered review.

The repository needs a manually triggered Session Artifact Advisor that:

- analyzes only session events not covered by the latest successful checkpoint;
- records an exact per-session processing boundary when supported;
- survives context compaction without performing LLM analysis on every turn;
- proposes durable artifacts such as `AGENTS.md` rules, skills, hooks, scripts,
  subagents, plugins, or MCP integrations;
- never implements a proposed artifact without the normal approved-task gate.

Codex lifecycle hooks expose stable event fields such as `session_id`,
`turn_id`, submitted user prompts, and final assistant messages. The optional
`transcript_path` is not a stable parsing interface and must not be the primary
cursor or event source.

Task `0016` is simultaneously in progress in the primary worktree. This task is
implemented in a separate worktree and branch. It must avoid product files and
shared package or CI configuration so that the two tasks remain independently
reviewable.

## Scope

- Add a repository skill at
  `.agents/skills/session-artifact-advisor/`.
- Make the skill explicitly invokable as `$session-artifact-advisor` and disable
  implicit invocation so analysis and repository writes occur only when the
  human requests them.
- Add concise skill instructions and only the scripts and references required
  for deterministic checkpoint preparation, completion, recovery, and
  validation.
- Add project-local Codex hook configuration under `.codex/`.
- Capture these lifecycle events using documented hook input fields:
  - `SessionStart` and `SessionEnd` lifecycle markers;
  - `UserPromptSubmit` with `session_id`, `turn_id`, and submitted prompt;
  - `Stop` with `session_id`, `turn_id`, and final assistant message;
  - `PreCompact` and `PostCompact` compaction markers.
- On an explicit advisor trigger, inject the current session and turn identity
  into model-visible hook context so the skill can select the correct ledger
  without relying on newest-file heuristics.
- Store operational state under `.session-advisor/` and exclude that directory
  from Git.
- Store one append-only JSONL event ledger per Codex session with:
  - a monotonic event sequence;
  - session and turn identity;
  - event type;
  - redacted event content where content is available;
  - a hash chained to the previous event.
- Do not persist tool outputs or hidden model reasoning.
- Apply best-effort redaction for common credential forms before writing event
  content and document that local capture cannot guarantee removal of every
  sensitive value.
- Add deterministic runtime commands, using the repository's existing Node.js
  runtime and standard library only, to:
  - initialize session state;
  - prepare the delta after the last covered event;
  - report a no-op when no new analyzable events exist;
  - create an idempotent run ID;
  - mark a run ready only after proposal updates succeed;
  - finalize the checkpoint after the trigger turn stops;
  - recover or safely retry an interrupted pending run;
  - report degraded continuity when event history or its hash chain cannot be
    verified;
  - purge local advisor state on explicit command.
- Keep independent cursors and pending-run state for concurrent sessions.
- Record a compact repository baseline with each completed checkpoint:
  repository root identity, Git `HEAD`, branch or detached state, and a
  working-tree status fingerprint.
- On later triggers, inspect only the relevant repository delta needed to
  validate new observations or existing affected proposals. Do not perform an
  unconditional full-repository reread.
- Add durable advisor documentation under `docs/ai/session-advisor/`:
  - the operating and privacy contract;
  - the artifact selection rubric;
  - the proposal lifecycle and schema;
  - an index of artifact proposals.
- Store accepted advisor output as one Markdown file per stable proposal ID to
  reduce duplicate proposals and cross-session edit conflicts.
- Define proposal states:
  `candidate`, `accepted`, `rejected`, `superseded`, and `implemented`.
- Require each proposal to include:
  - a stable deduplication key and proposal ID;
  - recommended artifact surface;
  - evidence checkpoint IDs;
  - recurrence and confidence;
  - expected benefit and maintenance cost;
  - alternatives considered;
  - current status.
- Add a bounded governance rule to `AGENTS.md`:
  an explicit `$session-artifact-advisor` invocation may update only advisor
  operational state and proposal documentation without a separate task, but
  proposed artifacts must still use the normal approved-task workflow.
- Add dependency-free automated tests for event capture, redaction, hash-chain
  validation, per-session cursor isolation, no-op behavior, interrupted-run
  recovery, compaction markers, and trigger-context output.
- Update `PROGRESS.md` to track this task without changing the product task
  sequence `0016` -> `0017`.
- Support a first-run bootstrap from currently visible conversation context.
  Mark that bootstrap provenance and continuity as degraded when pre-hook
  events cannot be reconstructed exactly.

## Out of Scope

- Product code, frontend code, backend code, API behavior, database schema,
  migrations, seed data, or planned bug behavior.
- Changes to root or workspace `package.json`, `pnpm-lock.yaml`, or GitHub
  Actions.
- New npm, pnpm, Python, system, hosted, MCP, or external service dependency.
- Scheduled or automatic semantic analysis.
- LLM calls from lifecycle hooks.
- Parsing undocumented Codex transcript JSONL as the primary event source.
- Persisting full tool inputs, tool outputs, environment variables, hidden
  reasoning, or unredacted secrets.
- Automatically creating, accepting, implementing, or committing proposed
  artifacts.
- Cross-repository aggregation or synchronization between machines.
- Packaging the advisor as a distributable plugin.
- Blocking compaction, user prompts, tools, or normal Codex session shutdown.
- Retrofactively guaranteeing complete capture of session content created
  before the hooks were active.
- Modifying task `0016` files in its primary worktree.

## Acceptance Criteria

- `$session-artifact-advisor` is discoverable as a repository skill and requires
  explicit invocation.
- Hook commands succeed without an LLM call and without a third-party package.
- A user prompt and its final assistant response produce ordered, hash-chained,
  redacted events in the correct session ledger.
- A compaction produces boundary markers without blocking or starting semantic
  analysis.
- The trigger hook provides the exact `session_id` and `turn_id` to the invoked
  skill.
- The first successful trigger creates a checkpoint that identifies its exact
  covered event sequence, or explicitly records degraded bootstrap continuity.
- A second trigger with no new analyzable events is a semantic no-op and does
  not create or duplicate a proposal.
- After a continued session, only events after the previous covered sequence
  are supplied for semantic analysis, together with compact checkpoint and
  proposal index state.
- A failed or interrupted analysis does not silently advance the covered event
  cursor.
- Retrying an interrupted run is idempotent and cannot duplicate events or
  proposals.
- Two captured sessions have independent ledgers, cursors, and pending runs.
- A broken or missing hash chain produces a visible degraded-continuity result
  instead of claiming exact incremental coverage.
- Repeated evidence updates an existing proposal by stable deduplication key.
- Each durable proposal satisfies the approved proposal schema and remains a
  recommendation until handled through the normal task lifecycle.
- Operational session state and captured content are ignored by Git.
- No product, package, lockfile, API contract, seed, bug registry, or CI change
  is present in the task diff.
- The task documentation states activation, privacy, retention/purge behavior,
  recovery behavior, and the limitation for pre-hook session history.

## Verification Plan

- Run the skill creator structural validator:
  `python C:\Users\User\.codex\skills\.system\skill-creator\scripts\quick_validate.py .agents/skills/session-artifact-advisor`
- Run dependency-free advisor tests:
  `node --test tests/session-artifact-advisor/*.test.mjs`
- Run syntax checks for each committed `.mjs` script:
  `node --check <script-path>`
- Run a temporary-directory integration scenario covering:
  capture -> prepare -> ready -> stop/finalize -> continued delta -> no-op.
- Inspect `git status --short` and `git diff --check`.
- Confirm `.session-advisor/` content is absent from `git status`.
- Confirm the diff contains no task `0016` implementation or product files.
- Manually inspect the generated trigger hook JSON and one redacted ledger
  fixture without retaining the fixture in the repository.

The first live end-to-end checkpoint in an actual Codex session may require a
new or resumed trusted-project session after project-local hooks are available.

## Verification Results

- `node --check
  .agents/skills/session-artifact-advisor/scripts/session-advisor-core.mjs`:
  passed.
- `node --check
  .agents/skills/session-artifact-advisor/scripts/session-advisor-state.mjs`:
  passed.
- `node --check .codex/hooks/session-artifact-advisor-hook.mjs`: passed.
- `node --test tests/session-artifact-advisor/*.test.mjs`: passed, 13 tests.
- The integration suite verifies the configured hook command from a nested
  repository directory on Windows.
- `git diff --check`: passed.
- `.session-advisor/` is absent from `git status`.
- The primary task `0016` worktree contains no task `0018` files or changes.
- The system skill validator could not start because its Python environment
  does not provide `PyYAML`. No dependency was installed because this task
  explicitly permits no new dependency. Equivalent checks for required
  frontmatter keys, skill name, explicit trigger text, absence of template
  TODOs, size, default prompt, and disabled implicit invocation pass in the
  Node test suite.
- A live Codex checkpoint remains an activation check after a new or resumed
  trusted-project session loads commit `6730ed8`.

## Documentation Impact

- Create `docs/ai/session-advisor/` operating documentation and proposal index.
- Update `AGENTS.md` with one bounded advisor routing and governance rule.
- Update `.gitignore` for local operational state.
- Update `PROGRESS.md` with the parallel infrastructure task.
- Create this task document.

## API Contract Impact

None.

## Seed Data Impact

None.

## Test Impact

Infrastructure tests only. The product testing taxonomy is not changed:

- Health tests: None.
- Clean core behavior tests: None.
- Bug verification tests: None.
- Contract tests: None.
- Performance smoke tests: None.

## Bug Registry Impact

None.

## Dependencies

No new dependencies, tools, or services.

Implementation uses:

- the existing project Node.js runtime and standard library;
- documented Codex repository skills and lifecycle hooks;
- the existing system `skill-creator` validation script for development-time
  structural verification.

## Commit Decision

Commit after this task.

The human project owner approved a separate task `0018` Infrastructure commit
on 2026-07-24 after task `0016` was committed and the advisor branch was
rebased onto it.

## Risks and Open Questions

- Project-local hooks load only for a trusted project and may require a new or
  resumed session before the live workflow is available.
- Existing pre-hook conversation history cannot be reconstructed exactly from
  compacted context. Bootstrap must make this limitation visible.
- Best-effort redaction cannot prove that arbitrary secrets are absent.
  Operational state therefore remains local and gitignored and supports an
  explicit purge command.
- Documented hook fields are the compatibility boundary. Hook implementation
  must fail safely if optional fields are absent.
- Multiple sessions may propose the same artifact concurrently. Stable proposal
  IDs and separate proposal files reduce, but do not eliminate, Git merge
  conflicts.
- Repository changes outside the captured chat may invalidate an older
  proposal. Checkpoint baselines support targeted revalidation but do not
  authorize a full unrelated repository audit.
- The initial implementation is repository-scoped. Cross-project learning may
  justify a later plugin or external store, but that requires a separate task.
