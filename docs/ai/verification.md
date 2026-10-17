# Verification

QA Comics Gym uses the task-first workflow. Acceptance comes from approved criteria and observed evidence. Select the smallest relevant checks and confirm prerequisites and permitted writes before running them.

The [project command catalog](project-agent-workflow.md#current-and-future-commands) preserves the existing commands and prerequisites. Record exact command, cwd, environment, result and limitations in the task. The Playwright tool-pipe/human-console distinction in AGENTS.md remains mandatory. Placeholder commands are unavailable until approved.

For task 0037, run only governance and configuration checks as installation self-checks:

- From QAGym: node scripts/validate-task-governance.mjs.
- From pinned codex-agent-template 8943479d83cdfbf3f394de2a90a14f3ea5ddfd04: node bin/codex-agent-template.mjs validate --target <QAGym> --output json.

Doctor checks format, local references and ignore behavior; RUNTIME_UNVERIFIED is not native acceptance. No application tests, dependencies, services, migrations, seeds or Playwright runs are part of setup acceptance.

Independent execution requires a disposable byte-matching candidate with actual governance/config inputs and required unchanged dependencies, enforced read-only product inputs, explicitly scoped scratch/temp writes and actual allowed/denied sentinel probes. A copy or worktree alone is not isolation. Compare original/copy hashes before and after checks. The coordinator assigns preparation separately; unavailable isolation leaves verification blocked.

Use distinct fresh auditors for reviews and verification; reviews do not execute project code. The implementer fixes confirmed findings, then affected evidence is renewed. Record setup readiness separately from runtime completion. The evidence checker checks structure/references/hashes; it does not prove report truth, isolation or native completion.

Before any later approved commit/push, run node scripts/check-task-closeout.mjs --task 0037 and inspect staged paths/diff. Task completion does not authorize a commit.
