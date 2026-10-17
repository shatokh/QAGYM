# Native Triumvirate Pilot

Task 0037 installs the Codex-only, task-first selection from codex-agent-template 0.6.0 at commit 8943479d83cdfbf3f394de2a90a14f3ea5ddfd04. The selected skills are feature-planner, triumvirate, verify-change and review-agent; roles are change-implementer and change-auditor. Existing project task formats, hooks and explicit-only workflows are retained.

## Activation and effective profile

Saved teamMode is triumvirate. For change tasks, the primary reads the [team skill](../../.agents/skills/triumvirate/SKILL.md); delegates obey their assigned phase and never coordinate a second team. Scope still requires a human-approved task. Record effectiveTeamMode separately from saved mode and pass it to each delegate. In saved single mode, an explicit $triumvirate invocation may activate one task without changing saved mode.

Project config and both customized native roles pin gpt-6.1-sol with high reasoning. Inspect actual configuration layers, role discovery, model, effort, thread identity and permissions at task start. A running primary needs native model control or a new session. Existing global trust was observed for QAGym; it is not changed by this task and still needs effective native validation. Never substitute a default model or alter global trust/config/credentials to force success. Record unsupported capabilities as blockers.

## Phases and setup acceptance

The primary plans/co-ordinates, a fresh auditor reviews the plan, the assigned implementer edits, a fresh auditor reviews the frozen diff, and a separate fresh auditor independently verifies. Reviews execute no project code. The implementer prepares verification infrastructure only under a separate assignment. Auditors never fix product files; they return findings to the implementer. See [delegation](delegation.md).

For setup acceptance, use one bounded native cycle with a prospective 600-second model-run budget and distinct phase identities on the selected profile. First supply a disposable byte-matching copy with required governance/config inputs and unchanged dependencies, actual read-only product enforcement and scoped scratch/temp outputs. Record successful read/scratch probes, denied disposable sentinel mutation, and original/copy input hashes before/after checks. Copying alone does not restrict network or side effects. No application service or application test is required or authorized by setup.

Config/doctor success cannot establish native acceptance, effective isolation or completion. Keep remaining criteria unproven when observations are unavailable. Task 0036 still requires separate approval and its own prepared application test environment.

## Checkpoints and recovery

Store factual results in task 0037 and PROGRESS.md; keep diagnostics in ignored .local paths. Record task/plan/candidate input hashes, source/procedure versions, dirty baseline, phase/thread identities, actual environment, authorized writes, commands/results, open findings, active delegates, remaining budget and next action. Keep reports free of secrets.

On timeout, quota/tool failure or interruption, retain incomplete status and resume at the first unconfirmed phase after checking state and prior authorization. Do not reapply completed edits or silently reuse stale evidence. Stop after two correction cycles without progress. Freeze product writes during review and compare the accepted candidate with the target again before closeout. Preserve concurrent user edits; no reset or automatic rollback is authorized. Local backups support reviewed manual reconciliation only.

Use [the evidence contract](../../.agents/skills/triumvirate/references/evidence.md) and its shipped checker for a ready-for-closeout checkpoint only after required phases. Record an actual local coordinator identity; do not invent future root completion events. A later observer may record native completion. Readiness and runtime completion remain separate. Missing native close support is a recorded limitation, not permission to call interruption closure.

## Adoption provenance and future updates

.agent-template-manifest.json deliberately owns only newly installed byte-unchanged selected generated artifacts: .agent-template.json and all resources of the four selected skills. Existing AGENTS.md, .gitignore and docs/tasks/TEMPLATE.md are excluded. The manually pinned .codex/config.toml, both customized role files and all seven reconciled project guides are also excluded. Existing hooks and advisor/next-task-planner/clean-chat-handoff files remain unmanaged and unchanged.

Future CLI updates can report conflicts on these customized or pre-existing paths; review and reconcile them manually. Never broaden the manifest to claim existing/custom content. Installation preparation, original bytes, path diffs, hashes and the old-to-new invariant mapping are retained in ignored source-checkout .local/qagym-pilot-setup-2026-10-16/implementation evidence.

## Disable automatic entry

Finish active delegates and record their actual status first. Prepare and review a change to set teamMode to single in .agent-template.json and update the primary-only AGENTS.md entry consistently; run configuration/governance checks. A CLI preview with --team-mode single may assist, but do not broadly apply it over manually reconciled files. Required roles/skills may remain installed; single mode does not auto-start the procedure. Explicit one-task activation remains available.

Disabling saved mode does not stop processes, revoke permissions or switch models. Any removal/restoration of infrastructure needs a reviewed task and baseline comparison preserving user edits. No automatic merge, commit, push or publication is part of the pilot. Ask the human separately about commit checkpoints under AGENTS.md.
