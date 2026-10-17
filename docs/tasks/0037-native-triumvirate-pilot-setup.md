# Task 0037: Native Triumvirate Pilot Setup

## Status

Done

## Approval Record

- Approved by: Repository owner in the Codex conversation.
- Approval reference: Human message "апрув приступаю" after review of this
  concrete task; continuation requested on 2026-10-17.
- Approved scope notes: Task 0037 only, with GPT-6.1 Sol/high for all three
  logical roles. Task 0036 remains Ready for Review and is not approved.

Approval was recorded before infrastructure implementation.

## Behavior Type

Infrastructure

## Priority

`P2 Normal`

## Work Origin

`Maintenance`

## Background

The human selected QAGym for the first real-repository trial of
codex-agent-template 0.6.0, committed as
`8943479d83cdfbf3f394de2a90a14f3ea5ddfd04`. The selected execution profile is
`gpt-6.1-sol` with `high` reasoning for the primary planner/coordinator,
implementer and every fresh auditor invocation.

The source implementation passed independent review, 145 repository tests,
extracted-package validation and controlled native workflow tests. Those
results do not prove integration with QAGym, its hooks or its application
runtime. This task installs and verifies the integration before a separately
approved real task uses it. Task 0036 remains Test Only and Ready for Review.

Preflight baseline: QAGym HEAD
`1fb18323d89e3f7697e125d2cfca5ff65a19ea4d`; existing uncommitted changes are
PROGRESS.md and the untracked task 0036. Preserve their prior contents and do
not stage, revert or retroactively approve them. Preparation of this task adds
only this document and its Active Tasks entry in PROGRESS.md.

## Unplanned Work Record

None. Implementation follows the explicitly approved scope.

## Scope

### Reviewed adoption

1. Generate a disposable candidate from the pinned template source using
   Codex, task-first workflow and triumvirate team mode. Inspect the exact
   paths/diffs against a fresh QAGym baseline before copying anything.
2. Install the new feature-planner, triumvirate, review-agent and verify-change
   skills with their selected metadata, references and evidence helper; install
   change-implementer and change-auditor under `.codex/agents/`.
3. Add `.agent-template.json` with the resolved selection and version 0.6.0.
   Create an ownership manifest only for newly installed, unchanged generated
   artifacts. Do not record customized/existing files as generator-owned.
   Customized pinned roles and project-specific guides remain protected manual
   reconciliation paths; future update conflicts on them are expected.
4. Reconcile the generated onboarding-notes, rule-quality-checklist,
   verification, local-overrides and delegation guides under `docs/ai/` with
   actual QAGym rules and commands. Add a short `docs/ai/triumvirate-pilot.md`
   describing activation, role boundaries, effective mode, model checks,
   checkpoint/recovery, test-environment limits and the opt-out procedure.

### Preserve project governance

- Adapt AGENTS.md manually; never replace it with the generic template. Keep
  always-on approval, locked scope, planned-bug/seed/API boundaries, explicit
  skill triggers, commit checkpoints and Playwright limitations in force.
- Reduce the current 256-line root to at most 200 lines by extracting long
  procedural/checklist/command references into
  `docs/ai/project-agent-workflow.md`. Keep governing rules in the root and
  link procedures where applicable; review an old-to-new invariant mapping.
- Add the primary-only triumvirate entry; it authorizes native delegation
  only inside the human-approved task scope. Delegates follow their assigned
  phase rather than starting another coordinator. Plan/code auditors do not
  execute project code; independent verification never fixes product files.
- Preserve `docs/tasks/TEMPLATE.md` byte-for-byte. Extend `.gitignore` only
  with necessary reviewed local-artifact/override rules, preserving existing
  patterns and the `.env.example` exception. Keep diagnostics out of Git.
- Inspect but do not modify existing `.codex/hooks.json`, `.codex/hooks/**`
  or the advisor, next-task-planner and clean-chat-handoff skills. Existing
  lifecycle capture may write its normal ignored `.session-advisor/` state;
  it is not an invocation of the explicit-only advisor workflow.

### Selected native model profile

Create or manually merge `.codex/config.toml` with:

```toml
model = "gpt-6.1-sol"
model_reasoning_effort = "high"

[agents]
default_subagent_model = "gpt-6.1-sol"
default_subagent_reasoning_effort = "high"
```

Pin the same supported `model` and `model_reasoning_effort` fields in both new
role files. Preserve unrelated settings and keep customized roles/config out
of generated ownership. New role instructions inherit the parent's sandbox;
model selection is not a permission boundary. Verify actual effective model,
effort and role identity; never silently substitute a cheaper/default model.
An already-running primary must use the native model control or a new session.
Do not edit global Codex configuration, credentials or project trust to force
success; record unavailable trust/access/capabilities as blockers.

### Bounded integration verification

- Review the task/plan before implementation, implement through assigned
  ownership, and independently review the final config/instruction diff.
  Record source versions, dirty baseline, candidate and delegate identities.
- Prepare a disposable, byte-matching verification copy containing the actual
  governance/config inputs and necessary unchanged dependencies. Use the
  installed native read-only sandbox with only explicitly scoped scratch/temp
  writes; verify allowed reads/scratch writes and denied sentinel mutation.
  A copy/worktree alone is not isolation. No application services are needed.
- Verify role/skill discovery, primary-only entry and all three logical roles
  on the selected model/effort in one bounded native setup-acceptance cycle.
  Use a prospective 600-second model-run budget; retain incomplete checkpoints
  on timeout/quota/tool failure rather than repeating unlimited runs.
- Keep reports in the task's Verification Results and ignored local evidence.
  Use the shipped checker for ready-for-closeout after required phases/checks;
  native root completion can be recorded later by an observer. Do not invent
  future completion events or describe format checks as semantic proof.
- Update PROGRESS.md only for this task's lifecycle and factual outcome.

## Out of Scope

- Implementing, approving or changing the scope/status of task 0036.
- Frontend/backend/product tests, API/Swagger contracts, migrations, seed data,
  planned bugs or registry entries.
- Installing dependencies or browsers, starting app/Docker/PostgreSQL services,
  database reset/seed operations or Playwright E2E execution.
- Replacing the existing advisor/hooks or adding a permanent runner, LLM
  backend, automated session ledger, merge, commit, push or new agent adapter.
- Global runtime/credential/trust changes, permission weakening, copying
  secrets, or adopting another contributor's dirty changes.
- Changing codex-agent-template in the same task; integration findings against
  upstream are recorded for a separate reviewed fix and re-verification.

## Acceptance Criteria

1. Selected roles, skill resources and config are installed from the pinned
   source; all customized paths/provenance are documented and protected from
   automatic replacement. Existing task 0036 and task-template bytes match the
   baseline; pre-existing PROGRESS.md edits remain intact.
2. Root instructions stay within 200 lines with no lost governance invariant;
   manual activation/disable guidance and referenced procedures are present.
3. Native runtime observations confirm GPT-6.1 Sol/high for planner,
   implementer and auditors, with distinct phase identities. Config files alone
   do not establish success. Required unavailable capabilities leave this
   criterion blocked.
4. Original/copy input hashes match before/after independent verification;
   actual isolation probes and permitted output locations are recorded.
5. Governance/configuration checks pass or retain specifically justified
   baseline/runtime limitations as unproven acceptance criteria. No placeholder
   command or unexecuted test is described as successful.
6. Existing hooks/explicit-only skills remain unchanged, diagnostics are
   ignored, application state is untouched, and the native smoke/closeout
   reports distinguish task readiness from runtime completion.
7. Task/progress evidence identifies remaining work for real-task pilot 0036;
   task completion and any commit remain separate human decisions.

## Verification Plan

- Before editing: Git status, focused diff, current governance validation and
  hashes of existing instructions/hooks/skills, task template and task 0036.
- `node scripts/validate-task-governance.mjs` from QAGym after task/progress
  edits; baseline passed with 36 tasks and 5 proposals before this draft.
- Configuration doctor from the pinned source checkout:
  `node bin/codex-agent-template.mjs validate --target <QAGym> --output json`.
  Runtime-unverified warnings are not native acceptance evidence.
- Independently inspect extracted rules, local references, preserved custom
  files/manifest exclusions and effective Git ignore behavior.
- Run the bounded native integration cycle and actual isolation probes above
  against the frozen setup candidate. Do not run QAGym application tests just
  to validate instruction installation.
- Before a later commit/push, run
  `node scripts/check-task-closeout.mjs --task 0037` and inspect the exact
  staged paths/diff; retain any unresolved closeout findings.

## Documentation Impact

This task, PROGRESS.md, AGENTS.md, the selected `docs/ai/` guides and the new
project workflow/pilot guides. Existing advisor records and task 0036 stay
unchanged. Existing project formats take precedence over generic forms.

## API Contract Impact

None.

## Seed Data Impact

None.

## Test Impact

Health tests for agent/governance configuration only. No application clean-core,
bug, API contract, performance or Playwright test implementation. Existing
governance tooling is used without changing its behavior or fixtures.

## Bug Registry Impact

None.

## Dependencies

Existing Git, Node.js 22+, the existing Codex client/CLI and signed-in access to
GPT-6.1 Sol/high; pinned codex-agent-template 0.6.0 source is the artifact
supplier. No new runtime packages, provider, API key, paid service or service
installation. Native checks use the configured Codex account and consume its
normal usage allowance; no allowance or permission bypass is authorized.

## Commit Decision

Commit after this task. The repository owner explicitly authorized a separate
0037 commit and push in the conversation after reviewing the implementation
and verification overview. Pre-existing task0036 draft and its PROGRESS entry
remain local and are excluded from this commit.

## Risks and Open Questions

- Project config/trust, native role discovery, hook compatibility and isolated
  command execution must be verified here; source-repository evidence is not a
  substitute. Missing required support is blocked, not an implicit single-mode
  fallback or permission expansion.
- High reasoning has measurable overhead. The 600-second integration budget
  is bounded; a concrete checkpoint and evidence-preserving continuation are
  preferable to retry loops or a silently extended success claim.
- Manual governance extraction can omit a rule; preserve a reviewed invariant
  mapping rather than treating a shorter file as sufficient acceptance.
- Partial ownership is deliberate. Future CLI updates can report conflicts on
  project-specific root/template/roles/guides; they require manual review.
- Real application verification for task 0036 still needs its own explicit
  approval and a prepared isolated frontend/backend/PostgreSQL environment.

## Verification Results

### Installation and review, 2026-10-17

Human approval was recorded before implementation. Source supplier is pinned
to 8943479d83cdfbf3f394de2a90a14f3ea5ddfd04 (0.6.0). Installation candidate:
05f84ed02929663654c8c91914ed28faa62e02563cf7c5779fb3326476743aa1.

- Installed 23 files (21 new). AGENTS.md is below 200 lines. All original
  governance sections survive verbatim in root or the workflow reference.
  The manifest owns only 10 unchanged generated artifacts; manually pinned
  roles, native config and reconciled guides remain protected manual paths.
- All 249 protected baseline file hashes remain unchanged, including 0036,
  TEMPLATE, hooks, existing skills and application files. Previous PROGRESS.md
  edits remain intact; only the 0037 lifecycle entry changed.
- Independent plan review passed (/root/qagym_plan_audit); independent code
  review passed (/root/qagym_code_audit). Installer was
  /root/qagym_setup_implementer. These exposed collaboration identities are
  not presented as independently observed raw native thread UUIDs.
- Installation self-checks passed: governance, 37 tasks/5 proposals; pinned
  source CLI doctor, valid:true/errors:[]. Exact commands, cwd and output,
  preserved original bytes, diffs and invariant mapping are retained in
  codex-agent-template/.local/qagym-pilot-setup-2026-10-16/implementation/.

### Observed suitability checks and resolved finding

Fresh independent verifier /root/qagym_independent_verifier selected checks
from the original seven criteria and inspected the supplied environment.
The first r2 run correctly denied sentinel mutation but could not spawn a
nested Node process (EPERM); governance did not run, doctor/Git were not run.
V0037-ENV-01 was assigned to the implementer. The failed report remains in
verification/reports/1792268097189-970486fe-d831-4429-8067-12c5815c9c68.json.

The implementer changed only temporary verification controls: each fixed
command now launches directly through the same read-only native sandbox.
The verifier's actual r3 recheck resolved V0037-ENV-01: four sandbox invocations
exited 0; read/scratch/temp probes passed, sentinel mutation failed EPERM and
bytes stayed unchanged; governance passed 37 tasks/5 proposals; doctor was
valid:true/errors:[]; actual target Git ignore probes preserved the
!.env.example exception. All 88 original/copy inputs and 97 external hashes
matched before and after execution. Successful report:
verification/reports/1792268278790-ec605622-dcd1-4146-aaa6-2c0f5399036d.json
in the ignored source-checkout evidence directory. Neither failed checks nor
configuration format checks are described as native model acceptance.

Doctor warnings are explicit: SECRET_PATTERN is a pre-existing false positive
in a convention filename; IGNORE_FALLBACK applies to the snapshot without
.git and does not replace the actual target Git check; RUNTIME_UNVERIFIED
means doctor cannot prove effective native model/role/permissions. Network is
disabled by the profile; no active network-denial probe is claimed.

### Native outcome, readiness and recovery

The current native-cycle outcome, actual model/effort and phase identities,
separate verification assessment, frozen candidate identity and readiness
checker result are maintained in the ignored
[local acceptance report](../../.local/triumvirate-0037/acceptance.md).
That report is updated only from observed events and actual check outputs.
At preparation of this frozen task record, the native cycle had not started;
600 seconds remained. A pending, failed or blocked linked report leaves
acceptance unproven. Reading this task or config alone never establishes pass.

Product inputs remain frozen during the cycle. Keeping runtime evidence in a
linked local record avoids changing the governance inputs being verified.
After interruption, use its latest observed checkpoint, compare current files
with the recorded candidate, inspect delegate state and resume only the first
unconfirmed phase. Do not repeat installation or silently extend the native
budget. All prior failed observations are retained.

At the verification freeze, the task was In Review and Commit Decision was
pending. The subsequent human-authorized closeout is recorded below.
No commit/push, dependency/browser installation, application test, service
startup, database operation or hook change is part of these checks. Task 0036
remains Ready for Review and still needs separate approval and a prepared
isolated frontend/backend/PostgreSQL environment for the real-task pilot.

### Final acceptance and authorized closeout (2026-10-17)

The human requested commit and push after the implementation overview. All
seven setup criteria independently passed. The single native cycle completed
in 335.912 seconds of its 600-second budget; all four phases passed. Observed
model/effort was gpt-6.1-sol/high for the primary, implementer and each fresh
auditor. Root thread: 01a14b85-c87c-7ac1-a481-5736ae995fde; completed root turn:
01a14b85-ca78-7f30-ba9c-fe9f231557ed.

The native verifier executed exactly one fixed host request. Four actual
read-only sandbox commands passed: isolation probes, governance, configuration
doctor and target Git ignore semantics. All 88 original/copy inputs and
97 external hashes matched before/after, and 249 protected baseline files
remained unchanged. Readiness and strict observed-native-completion evidence
checks both returned ok:true/errors:[]. These reports certify the frozen
r4 acceptance candidate, not future workspace revisions.

Limits remain explicit: root-session hook capture was not observed (ENOENT);
existing hooks are unchanged. Adversarial history exclusion, an active network
denial probe and explicit native close are not attested. ENV-1 is resolved;
the original failed r2 observation remains retained in local evidence.

For this closeout only Status, Commit Decision, Verification Results and the
0037 PROGRESS entry change. Approved scope/criteria and all 23 reviewed product
files are unchanged. Governance, task closeout and the exact staged governance
inputs are checked again before commit. No native cycle or application test
is repeated for record-only changes. Task0036 remains unapproved and local.
