#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const isHash = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const text = value => typeof value === "string" && value.trim().length > 0;
const nativeIdentity = value => text(value) && !["unknown", "unavailable", "not-exposed", "n/a", "none", "pending"].includes(value.trim().toLowerCase());
const inside = (root, target) => { const rel = path.relative(root, target); return rel === "" || (!rel.startsWith(`..${path.sep}`) && rel !== ".." && !path.isAbsolute(rel)); };
const portable = value => text(value) && !value.includes("\\") && !value.includes(":") && !value.includes("\0") && !path.posix.isAbsolute(value) && value.split("/").every(part => part !== "" && part !== "." && part !== "..");
export const inputDigest = files => sha256(JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b, "en"))));

// Structural/content correspondence only: reports and environment claims are not attestations.
export async function checkEvidence({ evidencePath, workspace, snapshot, requireTurnCompletion = false }) {
  const errors = [];
  let stage = "invalid";
  const need = (condition, message) => { if (!condition) errors.push(message); return condition; };
  try {
    const record = JSON.parse(await readFile(evidencePath, "utf8"));
    const artifacts = await realpath(path.dirname(path.resolve(evidencePath)));
    const original = await realpath(workspace);
    const copy = await realpath(snapshot);
    need(!inside(original, copy) && !inside(copy, original), "workspace and snapshot must be separate, non-nested directories");
    async function safePath(root, relative, { missing = false } = {}) {
      if (!portable(relative)) throw new Error(`unsafe relative path: ${relative}`);
      const target = path.resolve(root, relative);
      if (!inside(root, target)) throw new Error(`path escapes root: ${relative}`);
      let current = root;
      for (const part of relative.split("/")) {
        current = path.join(current, part);
        try { if ((await lstat(current)).isSymbolicLink()) throw new Error(`symlink is unsupported: ${relative}`); }
        catch (error) { if (missing && error.code === "ENOENT") return target; throw error; }
      }
      if (!inside(root, await realpath(target))) throw new Error(`resolved path escapes root: ${relative}`);
      return target;
    }
    async function artifact(ref, label) {
      if (!need(ref && portable(ref.path) && isHash(ref.sha256), `${label}: hashed artifact required`)) return;
      try { need(sha256(await readFile(await safePath(artifacts, ref.path))) === ref.sha256, `${label}: artifact hash differs`); }
      catch (error) { errors.push(`${label}: ${error.message}`); }
    }
    need(record.schemaVersion === 1, "unsupported schemaVersion");
    const task = record.task ?? {}, plan = record.plan ?? {}, candidate = record.candidate ?? {}, environment = record.environment ?? {};
    stage = task.status;
    need(text(task.id) && Number.isInteger(task.revision) && task.revision > 0, "task identity/revision required");
    need(["ready-for-closeout", "completed"].includes(stage), "task is neither ready-for-closeout nor completed");
    const hasRootIdentity = Object.hasOwn(task, "rootThreadId") || Object.hasOwn(task, "rootTurnId");
    const rootKnown = nativeIdentity(task.rootThreadId) && nativeIdentity(task.rootTurnId);
    need(!hasRootIdentity || rootKnown, "observed native root thread/turn identities must be a nonempty pair without unknown placeholders");
    const coordinatorId = task.coordinatorId ?? (stage === "completed" ? task.rootThreadId : undefined);
    need(text(coordinatorId), "local coordinator identity required");
    need(!requireTurnCompletion || stage === "completed", "native turn completion is required");
    if (stage === "completed" || Object.hasOwn(task, "completion")) {
      need(rootKnown && task.completion?.threadId === task.rootThreadId && task.completion?.turnId === task.rootTurnId && task.completion?.status === "completed", "completion must identify the root thread and turn");
      await artifact(task.completion?.evidence, "root completion");
    }
    need(text(plan.id) && Number.isInteger(plan.revision) && plan.revision > 0, "plan identity/revision required");
    need(record.effectiveTeamMode === "triumvirate" && ["single", "triumvirate"].includes(record.savedTeamMode), "saved/effective team modes required");
    need(record.savedTeamMode !== "single" || text(record.overrideReason), "explicit override reason required for saved single mode");
    need(text(record.runtime?.name) && ["codex", "claude"].includes(record.runtime.name) && text(record.runtime.version) && text(record.runtime.procedureVersion), "one runtime and pinned procedure version required");
    need(text(record.baseline?.id), "baseline identity required");
    await artifact(record.baseline?.artifact, "baseline");
    await artifact(plan.artifact, "plan");
    need(text(environment.id), "environment identity required");
    await artifact(environment.artifact, "environment");
    need(text(candidate.id), "candidate identity required");
    const files = candidate.files;
    const roots = candidate.roots;
    if (need(files && typeof files === "object" && !Array.isArray(files) && Object.keys(files).length > 0, "candidate files inventory required") && need(Array.isArray(roots) && roots.length > 0 && roots.every(portable) && new Set(roots).size === roots.length, "candidate roots required")) {
      need(roots.every((root, i) => roots.every((other, j) => i === j || !root.startsWith(`${other}/`))), "candidate roots must not overlap");
      const entries = Object.entries(files);
      for (const [name, hash] of entries) {
        need(portable(name) && roots.some(root => name === root || name.startsWith(`${root}/`)), `inventory path outside roots: ${name}`);
        need(hash === null || isHash(hash), `invalid input hash: ${name}`);
      }
      need(isHash(candidate.inputDigest) && inputDigest(files) === candidate.inputDigest, "candidate input digest differs");
      for (const [label, root] of [["workspace", original], ["snapshot", copy]]) {
        const seen = new Set();
        async function inspect(relative) {
          const target = await safePath(root, relative, { missing: true });
          let stat;
          try { stat = await lstat(target); } catch (error) { if (error.code === "ENOENT") return; throw error; }
          if (stat.isDirectory()) { for (const entry of await readdir(target)) await inspect(`${relative}/${entry}`); }
          else if (stat.isFile()) { seen.add(relative); need(Object.hasOwn(files, relative) && files[relative] !== null, `${label}: unlisted input ${relative}`); }
          else throw new Error(`unsupported input type: ${relative}`);
        }
        try {
          for (const relative of roots) await inspect(relative);
          for (const [relative, expected] of entries) {
            const target = await safePath(root, relative, { missing: true });
            if (expected === null) {
              try { await lstat(target); need(false, `${label}: deleted input exists: ${relative}`); } catch (error) { if (error.code !== "ENOENT") throw error; }
            } else {
              need(seen.has(relative), `${label}: missing input ${relative}`);
              if (seen.has(relative)) need(sha256(await readFile(target)) === expected, `${label}: input hash differs: ${relative}`);
            }
          }
        } catch (error) { errors.push(`${label}: ${error.message}`); }
      }
    }
    const phases = record.phases ?? {};
    const ids = rootKnown ? [task.rootThreadId] : [];
    for (const phase of ["plan-review", "implementation", "implementation-review", "verification"]) {
      const result = phases[phase] ?? {};
      need(nativeIdentity(result.actorId), `${phase}: native actor identity required`);
      ids.push(result.actorId);
      need(result.status === "pass", `${phase}: not passed`);
      need(result.taskId === task.id && result.taskRevision === task.revision && result.planId === plan.id && result.planRevision === plan.revision && result.planSha256 === plan.artifact?.sha256, `${phase}: stale task/plan identity`);
      if (phase !== "plan-review") need(result.candidateId === candidate.id && result.inputDigest === candidate.inputDigest && result.environmentId === environment.id && result.environmentSha256 === environment.artifact?.sha256, `${phase}: stale candidate/environment identity`);
      await artifact(result.report, `${phase} report`);
      await artifact(result.trace, `${phase} native trace`);
    }
    need(new Set(ids).size === ids.length, "root and all phase actors must be distinct");
    const verification = phases.verification ?? {};
    need(verification.isolationStatus === "provided", "verification isolation is not provided");
    const checks = verification.checks;
    const checkIds = new Set();
    if (need(Array.isArray(checks) && checks.length > 0, "verification checks required")) for (const check of checks) {
      need(text(check.id) && !checkIds.has(check.id), "verification check IDs must be unique"); checkIds.add(check.id);
      need(check.status === "pass", `check ${check.id}: successful verification required`);
      const kind = check.kind === undefined ? "execution" : check.kind;
      if (kind === "execution") need(text(check.command) && text(check.cwd) && check.exitCode === 0, `check ${check.id}: command/cwd/successful execution required`);
      else if (kind === "manual") {
        need(text(check.method) && text(check.observedResult), `check ${check.id}: manual method and observed result required`);
        need(!["command", "cwd", "exitCode"].some(key => Object.hasOwn(check, key)), `check ${check.id}: manual evidence must not claim command execution`);
      } else need(false, `check ${check.id}: unsupported verification kind`);
      await artifact(check.evidence, `check ${check.id}`);
    }
    if (need(Array.isArray(record.criteria) && record.criteria.length > 0, "criteria required")) {
      const criteriaIds = new Set(); let mandatoryCount = 0;
      for (const criterion of record.criteria) {
        need(text(criterion.id) && !criteriaIds.has(criterion.id), "criterion IDs must be unique"); criteriaIds.add(criterion.id);
        need(typeof criterion.mandatory === "boolean", `criterion ${criterion.id}: mandatory flag required`);
        if (criterion.mandatory) { mandatoryCount++; need(criterion.status === "pass", `criterion ${criterion.id}: mandatory criterion not passed`); }
        await artifact(criterion.evidence, `criterion ${criterion.id}`);
      }
      need(mandatoryCount > 0, "at least one mandatory criterion required");
    }
    const findingIds = new Set();
    if (need(Array.isArray(record.findings), "findings array required")) for (const finding of record.findings) {
      need(!findingIds.has(finding.id), `finding ${finding.id}: duplicate identity`); findingIds.add(finding.id);
      need(text(finding.id) && ["resolved", "rejected"].includes(finding.status), `finding ${finding.id}: unresolved or invalid state`);
      need(text(finding.reason) && text(finding.confirmedBy), `finding ${finding.id}: resolution reason/owner required`);
      if (finding.status === "resolved") need([phases["implementation-review"]?.actorId, verification.actorId, phases["plan-review"]?.actorId].includes(finding.confirmedBy), `finding ${finding.id}: auditor confirmation required`);
      if (finding.status === "rejected") need(finding.confirmedBy === coordinatorId || (rootKnown && finding.confirmedBy === task.rootThreadId), `finding ${finding.id}: primary rejection required`);
      await artifact(finding.evidence, `finding ${finding.id}`);
    }
  } catch (error) { errors.push(error.message); }
  const ok = errors.length === 0;
  return { ok, errors, checkpoint: { stage: ok ? stage : "invalid", readyForCloseout: ok, turnCompletionRecorded: ok && stage === "completed" } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (![5, 6].includes(args.length) || args[1] !== "--workspace" || args[3] !== "--snapshot" || (args.length === 6 && args[5] !== "--require-turn-completion")) {
    console.error("Usage: node check-evidence.mjs evidence.json --workspace <target> --snapshot <verification-copy> [--require-turn-completion]");
    process.exitCode = 2;
  } else {
    const result = await checkEvidence({ evidencePath: args[0], workspace: args[2], snapshot: args[4], requireTurnCompletion: args.length === 6 });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
  }
}
