# Task evidence version 1

Use a compact task record and linked evidence; do not create an automatic ledger. The opt-in checker has two closeout stages after mandatory phases/criteria and final workspace reconciliation. The primary validates `ready-for-closeout` before replying; a later turn or external observer can optionally finalize `completed` using an actual native root completion event. Do not invent native IDs/events or require your own future event before your response. Keep interrupted work in its ordinary task record until mandatory phases are complete.

```text
node <skill-directory>/scripts/check-evidence.mjs <evidence.json> --workspace <target> --snapshot <verification-copy> [--require-turn-completion]
```

The executable has no dependencies beyond Node 22+. Exit 0 means structural/content correspondence passed for the recorded stage, 1 means rejected evidence, 2 means invalid command usage. Its import API is `await checkEvidence({ evidencePath, workspace, snapshot, requireTurnCompletion: false })`, returning `{ ok, errors, checkpoint: { stage, readyForCloseout, turnCompletionRecorded } }`. Successful stage is `ready-for-closeout` or `completed`; failed validation returns stage `invalid` and both booleans false. `ok` alone does not mean the native turn completed. The strict API option or CLI flag requires the completed stage with matching root event evidence; use it only after that event is observable. This checks the recorded claim, not its authenticity.

The helper writes no files and executes no project commands. `sha256(bytes)` and `inputDigest(files)` exports help prepare the record; the coordinator still owns preparation and human review. Paths passed by CLI may be absolute. The target and copy must be separate, non-nested directories.

## Contract

All fields below are required unless marked optional. Strings representing IDs must be nonempty; revisions are positive integers; hashes are lowercase SHA-256 hex. An `artifact` is `{ "path": "relative/file", "sha256": "<hash>" }`. Artifact paths are relative to the evidence JSON's directory, must exist, and are checked against actual bytes. Absolute paths, backslashes, colon, empty/dot/parent components, and symlinks are rejected. Keep reports, trace excerpts and logs beneath that evidence directory. Avoid secrets and unrelated full-session captures.

| Field | Contents |
| --- | --- |
| schemaVersion | `1` |
| savedTeamMode / effectiveTeamMode | `single` or `triumvirate` / `triumvirate` |
| overrideReason | Required nonempty string when saved mode is single; explicit invocation/authorization |
| runtime | `{name: "codex" or "claude", version, procedureVersion}`; one runtime per team |
| task | `{id, revision, coordinatorId, status: "ready-for-closeout" or "completed"}`; coordinatorId is an explicit **local task actor ID**, never presented as native identity |
| task.rootThreadId / rootTurnId | Optional observed native ID pair at readiness; both must be nonempty if supplied. Required for completed stage; omit unknown IDs rather than using placeholder values such as unknown/unavailable/not-exposed |
| task.completion | Required for completed stage: `{threadId, turnId, status: "completed", evidence: artifact}` matching the observed root identity; child completion is insufficient. Omit at readiness until an actual event exists; if supplied, it is validated |
| baseline | `{id, artifact}`; evidence records starting tree, dirty edits, selected untracked/deleted paths, task delta ownership |
| plan | `{id, revision, artifact}`; artifact includes original criteria, commands and authorized scope |
| environment | `{id, artifact}`; artifact describes exact runtime/dependency/procedure inputs, restrictions, scratch/resources and actual probes |
| candidate | `{id, roots, files, inputDigest}`; see inventory below |
| phases | Keys `plan-review`, `implementation`, `implementation-review`, `verification`, each containing a phase record |
| criteria | Nonempty array of `{id, mandatory: boolean, status, evidence: artifact}`; unique IDs, at least one mandatory, all mandatory statuses `pass` |
| findings | Array, possibly empty, of final resolution records described below |

A phase record has `actorId` (native thread identity), `status: "pass"`, `taskId`, `taskRevision`, `planId`, `planRevision`, `planSha256`, `report: artifact`, and `trace: artifact`. All phase actor IDs must differ from each other and, when observed, the primary native root. Local coordinator identity is not a substitute for native evidence. Every phase after plan-review also includes matching `candidateId`, `inputDigest`, `environmentId`, and `environmentSha256` (environment artifact hash). Repeated role-name markers are not identities. A trace is manually retained native evidence of the relevant invocation/actions; merely copying an actor ID into a report does not establish provenance. Existing completed records may omit coordinatorId and use their observed rootThreadId as coordinator identity for compatibility; readiness records require explicit coordinatorId.

Verification additionally requires `isolationStatus: "provided"` and a nonempty `checks` array. Every check has unique `id`, `status: "pass"`, and `evidence: artifact` containing actual results. Choose the kind appropriate to the criterion:

- `kind: "execution"` (also the default when omitted for compatibility) requires `command`, `cwd`, and `exitCode: 0`. These are recorded strings/results, not commands executed by the checker.
- `kind: "manual"` requires nonempty `method` and `observedResult` describing actual inspection or scenario walkthrough, plus the hashed evidence above. Omit `command`, `cwd`, and `exitCode`; claiming command execution in a manual record is rejected. For example, a documentation check may record the checklist applied, exact inspected section and observed behavior without inventing a test process.

Manual inspection is appropriate for documentary/no-code criteria and does not substitute for required executable checks. Record tool failures, timeouts, skipped tests or unavailable prerequisites honestly in the task record; changing a failed execution record to manual is not a repair. They cannot produce a passing final checkpoint. Use criteria evidence to explain why the selected checks establish each acceptance criterion. Separate verification identity, environment and matching frozen inputs remain required for either kind; the checker cannot judge whether the chosen method is sufficient.

A final finding record contains unique `id`, `status: "resolved"` or `"rejected"`, `reason`, `confirmedBy`, and `evidence: artifact`. Resolved findings require an auditor actor ID; rejected findings require coordinatorId and counterevidence (an observed rootThreadId is also accepted for existing records). Operational states open/fixed-awaiting-check/disputed remain in the task record; the final checker rejects them. Evidence must explain the finding's affected candidate and recheck. This structural checker cannot infer whether a resolution is technically correct.

## Complete scoped inventory

`candidate.roots` lists non-overlapping relative files/directories covering **all execution/review inputs needed by this task**, for example `['src', 'test', 'package.json', 'package-lock.json']`. The skill does not decide completeness from a list. Include applicable instructions/procedure versions, commands and configuration, or record external immutable inputs in environment evidence. Keep scratch/caches, evidence output and unrelated metadata outside these roots; do not silently exclude a product input to obtain pass.

`candidate.files` maps each existing file beneath these roots to its SHA-256. Include selected new/untracked files. A deletion maps its prior relative path to `null`; that path must be absent in both target and copy. Every discovered file in each root must appear in this map, and every non-null entry must exist. New unlisted files, missing files, resurrected deletions, changed tests/config/dependencies and different snapshot bytes fail. Roots and entries use the same safe relative path format as artifacts; symlinks and special files are unsupported and must be handled by a separately agreed packaging mechanism rather than accepted here.

`inputDigest` is SHA-256 of UTF-8 `JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b, 'en')))`. Prefer the exported helper to avoid differing normalization. Before and after actual verification, independently compare the supplied inputs to the frozen inventory; run the final checker after reconciliation. A single final invocation cannot prove that files had these bytes when earlier tests ran.

## Limits

The checker detects missing/stale identities, links, unsuccessful required phases/checks, unresolved findings, and byte mismatch within the declared input scope. It does not authenticate reports, evaluate criteria semantics, establish trusted native provenance/history freshness, inspect a test runner's actual execution, enforce sandbox restrictions, prove absence of external side effects, detect omitted input roots, or provide atomic filesystem snapshots. An actor with write access can rewrite a manifest and reports. Manual review and runtime evidence remain necessary; a passing checker alone never accepts a task. No automatic snapshot copy, product edits, hooks, runner, commit, merge or publication occurs.
