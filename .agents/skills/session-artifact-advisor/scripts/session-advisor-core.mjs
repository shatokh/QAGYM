import { execFileSync } from "node:child_process";
import {
  appendFile,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

const SCHEMA_VERSION = 1;
const GENESIS_HASH = "GENESIS";
const RUNTIME_DIR = ".session-advisor";
const LOCK_STALE_MS = 30_000;
const LOCK_RETRIES = 40;
const LOCK_RETRY_MS = 25;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function safeSessionId(sessionId) {
  const normalized = String(sessionId || "unknown").replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );
  return `${normalized.slice(0, 80)}-${sha256(String(sessionId)).slice(0, 10)}`;
}

export function findRepositoryRoot(startDirectory) {
  let current = path.resolve(startDirectory);
  const { root } = path.parse(current);

  while (current !== root) {
    if (existsSync(path.join(current, ".git"))) {
      return current;
    }
    current = path.dirname(current);
  }

  throw new Error(`Unable to find repository root from ${startDirectory}`);
}

export function runtimeRoot(repositoryRoot) {
  return path.join(repositoryRoot, RUNTIME_DIR);
}

export function sessionPaths(repositoryRoot, sessionId) {
  const sessionDirectory = path.join(
    runtimeRoot(repositoryRoot),
    "sessions",
    safeSessionId(sessionId),
  );

  return {
    sessionDirectory,
    events: path.join(sessionDirectory, "events.jsonl"),
    meta: path.join(sessionDirectory, "meta.json"),
    checkpoint: path.join(sessionDirectory, "checkpoint.json"),
    runs: path.join(sessionDirectory, "runs"),
    lock: path.join(sessionDirectory, ".lock"),
  };
}

export function isAdvisorTrigger(prompt) {
  return String(prompt || "").includes("$session-artifact-advisor");
}

export function redactSensitiveText(value) {
  if (typeof value !== "string") {
    return null;
  }

  return value
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
      "[REDACTED_PRIVATE_KEY]",
    )
    .replace(
      /\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{16,})\b/g,
      "[REDACTED_TOKEN]",
    )
    .replace(
      /\b(Bearer)\s+[A-Za-z0-9._~+/=-]{12,}\b/gi,
      "$1 [REDACTED_TOKEN]",
    )
    .replace(
      /\b(api[_-]?key|access[_-]?token|auth[_-]?token|password|passwd|secret)\s*([:=])\s*([^\s,;]+)/gi,
      "$1$2[REDACTED]",
    )
    .replace(
      /:\/\/([^:/\s]+):([^@\s]+)@/g,
      "://$1:[REDACTED]@",
    );
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function atomicWriteJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  try {
    await rename(temporaryPath, filePath);
  } catch (error) {
    if (!["EEXIST", "EPERM"].includes(error.code)) {
      throw error;
    }
    await rm(filePath, { force: true });
    await rename(temporaryPath, filePath);
  }
}

async function removeStaleLock(lockPath) {
  try {
    const lockStat = await stat(lockPath);
    if (Date.now() - lockStat.mtimeMs > LOCK_STALE_MS) {
      await unlink(lockPath);
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function withSessionLock(repositoryRoot, sessionId, operation) {
  const paths = sessionPaths(repositoryRoot, sessionId);
  await mkdir(paths.sessionDirectory, { recursive: true });

  let lockHandle;
  for (let attempt = 0; attempt < LOCK_RETRIES; attempt += 1) {
    try {
      lockHandle = await open(paths.lock, "wx");
      await lockHandle.writeFile(
        JSON.stringify({ pid: process.pid, acquired_at: new Date().toISOString() }),
      );
      break;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
      await removeStaleLock(paths.lock);
      await sleep(LOCK_RETRY_MS);
    }
  }

  if (!lockHandle) {
    throw new Error(`Timed out waiting for session lock: ${sessionId}`);
  }

  try {
    return await operation(paths);
  } finally {
    await lockHandle.close();
    await unlink(paths.lock).catch((error) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
  }
}

function eventHash(eventWithoutHash) {
  return sha256(JSON.stringify(eventWithoutHash));
}

async function readLedgerUnlocked(paths) {
  let raw;
  try {
    raw = await readFile(paths.events, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return { ok: true, events: [], lastHash: GENESIS_HASH };
    }
    throw error;
  }

  const lines = raw.split(/\r?\n/).filter(Boolean);
  const events = [];
  let previousHash = GENESIS_HASH;
  let validationReason = null;

  for (let index = 0; index < lines.length; index += 1) {
    let event;
    try {
      event = JSON.parse(lines[index]);
    } catch {
      return {
        ok: false,
        events,
        lastHash: previousHash,
        reason: `invalid_json_at_line_${index + 1}`,
      };
    }

    const { hash, ...eventWithoutHash } = event;
    const expectedSequence = index + 1;
    if (event.seq !== expectedSequence && !validationReason) {
      validationReason = `invalid_sequence_at_line_${index + 1}`;
    }
    if (event.prev_hash !== previousHash && !validationReason) {
      validationReason = `invalid_previous_hash_at_line_${index + 1}`;
    }
    if (hash !== eventHash(eventWithoutHash) && !validationReason) {
      validationReason = `invalid_hash_at_line_${index + 1}`;
    }

    events.push(event);
    previousHash = hash;
  }

  return {
    ok: validationReason === null,
    events,
    lastHash: previousHash,
    reason: validationReason,
  };
}

export async function validateLedger(repositoryRoot, sessionId) {
  return withSessionLock(repositoryRoot, sessionId, (paths) =>
    readLedgerUnlocked(paths),
  );
}

async function appendEventUnlocked(paths, input) {
  let meta = await readJson(paths.meta, null);
  if (
    !meta ||
    meta.schema_version !== SCHEMA_VERSION ||
    meta.session_id !== input.sessionId ||
    !Number.isInteger(meta.last_seq) ||
    typeof meta.last_hash !== "string"
  ) {
    const ledger = await readLedgerUnlocked(paths);
    if (!ledger.ok) {
      throw new Error(`Cannot append to invalid ledger: ${ledger.reason}`);
    }
    meta = {
      last_seq: ledger.events.length,
      last_hash: ledger.lastHash,
    };
  }

  const sequence = meta.last_seq + 1;
  const eventWithoutHash = {
    schema_version: SCHEMA_VERSION,
    seq: sequence,
    session_id: input.sessionId,
    turn_id: input.turnId || null,
    event_type: input.eventType,
    timestamp: input.timestamp || new Date().toISOString(),
    content:
      typeof input.content === "string"
        ? redactSensitiveText(input.content)
        : null,
    attributes: input.attributes || {},
    prev_hash: meta.last_hash,
  };
  const event = {
    ...eventWithoutHash,
    hash: eventHash(eventWithoutHash),
  };

  await appendFile(paths.events, `${JSON.stringify(event)}\n`, "utf8");
  await atomicWriteJson(paths.meta, {
    schema_version: SCHEMA_VERSION,
    session_id: input.sessionId,
    last_seq: sequence,
    last_hash: event.hash,
    updated_at: event.timestamp,
  });
  return event;
}

export async function appendEvent(repositoryRoot, input) {
  return withSessionLock(repositoryRoot, input.sessionId, (paths) =>
    appendEventUnlocked(paths, input),
  );
}

async function listRunFiles(paths) {
  try {
    const entries = await readdir(paths.runs, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(paths.runs, entry.name, "run.json"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function findRunByTurnUnlocked(paths, turnId) {
  const files = await listRunFiles(paths);
  const matches = [];
  for (const file of files) {
    const run = await readJson(file);
    if (run?.trigger_turn_id === turnId) {
      matches.push({ file, run });
    }
  }
  return matches.sort((left, right) =>
    right.run.created_at.localeCompare(left.run.created_at),
  )[0] || null;
}

function repositoryBaseline(repositoryRoot) {
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

  try {
    const status = git("status", "--porcelain=v1", "--untracked-files=all");
    return {
      repository_root_hash: sha256(path.resolve(repositoryRoot)),
      head: git("rev-parse", "HEAD"),
      branch: git("rev-parse", "--abbrev-ref", "HEAD"),
      working_tree_status_hash: sha256(status),
    };
  } catch {
    return {
      repository_root_hash: sha256(path.resolve(repositoryRoot)),
      head: null,
      branch: null,
      working_tree_status_hash: null,
    };
  }
}

async function finalizeRunUnlocked(paths, repositoryRoot, runRecord, assistantEvent) {
  const checkpointId = `cp-${runRecord.run.run_id.slice(0, 16)}`;
  const checkpoint = {
    schema_version: SCHEMA_VERSION,
    checkpoint_id: checkpointId,
    session_id: runRecord.run.session_id,
    trigger_turn_id: runRecord.run.trigger_turn_id,
    covered_event_seq: assistantEvent.seq,
    covered_event_hash: assistantEvent.hash,
    continuity: runRecord.run.continuity,
    bootstrap: runRecord.run.bootstrap,
    proposal_ids: runRecord.run.proposal_ids || [],
    repository: repositoryBaseline(repositoryRoot),
    completed_at: new Date().toISOString(),
  };

  await atomicWriteJson(paths.checkpoint, checkpoint);
  runRecord.run.status = "finalized";
  runRecord.run.checkpoint_id = checkpointId;
  runRecord.run.finalized_at = checkpoint.completed_at;
  await atomicWriteJson(runRecord.file, runRecord.run);
  return checkpoint;
}

async function recoverReadyRunsUnlocked(paths, repositoryRoot, ledger) {
  const files = await listRunFiles(paths);
  const recoverable = [];

  for (const file of files) {
    const run = await readJson(file);
    if (run?.status !== "ready") {
      continue;
    }
    const assistantEvent = ledger.events.find(
      (event) =>
        event.turn_id === run.trigger_turn_id &&
        event.event_type === "assistant_message",
    );
    if (assistantEvent) {
      recoverable.push({ file, run, assistantEvent });
    }
  }

  recoverable.sort(
    (left, right) => left.assistantEvent.seq - right.assistantEvent.seq,
  );
  const recovered = [];
  for (const record of recoverable) {
    recovered.push(
      await finalizeRunUnlocked(
        paths,
        repositoryRoot,
        { file: record.file, run: record.run },
        record.assistantEvent,
      ),
    );
  }
  return recovered;
}

export async function prepareRun(repositoryRoot, sessionId, triggerTurnId) {
  return withSessionLock(repositoryRoot, sessionId, async (paths) => {
    const ledger = await readLedgerUnlocked(paths);
    await recoverReadyRunsUnlocked(paths, repositoryRoot, ledger);

    const checkpoint = await readJson(paths.checkpoint, null);
    const triggerEvent = [...ledger.events]
      .reverse()
      .find(
        (event) =>
          event.turn_id === triggerTurnId &&
          event.event_type === "user_prompt" &&
          event.attributes?.advisor_trigger === true,
      );

    if (!triggerEvent) {
      throw new Error(
        `Advisor trigger event not found for turn ${triggerTurnId}`,
      );
    }

    const runId = sha256(
      [
        sessionId,
        triggerTurnId,
        checkpoint?.covered_event_seq || 0,
        triggerEvent.seq - 1,
      ].join(":"),
    );
    const runDirectory = path.join(paths.runs, runId);
    const runFile = path.join(runDirectory, "run.json");
    const deltaFile = path.join(runDirectory, "delta.json");
    const existing = await readJson(runFile, null);
    if (existing) {
      return {
        status: existing.status,
        run_id: existing.run_id,
        delta_path: deltaFile,
        event_count: existing.event_count,
        no_op: existing.no_op,
        bootstrap: existing.bootstrap,
        continuity: existing.continuity,
      };
    }

    const priorRunFiles = await listRunFiles(paths);
    for (const priorRunFile of priorRunFiles) {
      const priorRun = await readJson(priorRunFile);
      if (priorRun?.status === "prepared") {
        priorRun.status = "superseded";
        priorRun.superseded_by = runId;
        priorRun.superseded_at = new Date().toISOString();
        await atomicWriteJson(priorRunFile, priorRun);
      }
    }

    const coveredSequence = checkpoint?.covered_event_seq || 0;
    const upperSequence = triggerEvent.seq - 1;
    const analyzableEvents = ledger.events.filter(
      (event) =>
        event.seq > coveredSequence &&
        event.seq <= upperSequence &&
        !event.attributes?.advisor_internal &&
        ["user_prompt", "assistant_message"].includes(event.event_type),
    );
    const firstSessionStart = ledger.events.find(
      (event) => event.event_type === "session_start",
    );
    const bootstrap =
      !checkpoint &&
      (!firstSessionStart ||
        firstSessionStart.attributes?.source !== "startup");
    const continuity = ledger.ok
      ? bootstrap
        ? {
            status: "degraded",
            reason: "pre_hook_history_unavailable",
          }
        : { status: "exact", reason: null }
      : { status: "degraded", reason: ledger.reason };
    const noOp = analyzableEvents.length === 0 && !bootstrap;

    const delta = {
      schema_version: SCHEMA_VERSION,
      run_id: runId,
      session_id: sessionId,
      trigger_turn_id: triggerTurnId,
      from_event_seq: coveredSequence + 1,
      through_event_seq: upperSequence,
      prior_checkpoint: checkpoint,
      continuity,
      bootstrap,
      no_op: noOp,
      events: analyzableEvents,
    };
    const run = {
      schema_version: SCHEMA_VERSION,
      run_id: runId,
      session_id: sessionId,
      trigger_turn_id: triggerTurnId,
      status: "prepared",
      from_event_seq: delta.from_event_seq,
      through_event_seq: delta.through_event_seq,
      event_count: analyzableEvents.length,
      no_op: noOp,
      bootstrap,
      continuity,
      proposal_ids: [],
      created_at: new Date().toISOString(),
    };

    await mkdir(runDirectory, { recursive: true });
    await atomicWriteJson(deltaFile, delta);
    await atomicWriteJson(runFile, run);

    return {
      status: run.status,
      run_id: runId,
      delta_path: deltaFile,
      event_count: run.event_count,
      no_op: noOp,
      bootstrap,
      continuity,
    };
  });
}

export async function markRunReady(
  repositoryRoot,
  sessionId,
  triggerTurnId,
  proposalIds = [],
) {
  return withSessionLock(repositoryRoot, sessionId, async (paths) => {
    const runRecord = await findRunByTurnUnlocked(paths, triggerTurnId);
    if (!runRecord) {
      throw new Error(`Prepared run not found for turn ${triggerTurnId}`);
    }
    if (!["prepared", "ready"].includes(runRecord.run.status)) {
      throw new Error(`Run cannot become ready from ${runRecord.run.status}`);
    }

    runRecord.run.status = "ready";
    runRecord.run.proposal_ids = [...new Set(proposalIds)].sort();
    runRecord.run.ready_at = new Date().toISOString();
    await atomicWriteJson(runRecord.file, runRecord.run);
    return runRecord.run;
  });
}

export async function finalizeReadyRun(
  repositoryRoot,
  sessionId,
  triggerTurnId,
  assistantEvent,
) {
  return withSessionLock(repositoryRoot, sessionId, async (paths) => {
    const runRecord = await findRunByTurnUnlocked(paths, triggerTurnId);
    if (!runRecord || runRecord.run.status !== "ready") {
      return null;
    }
    return finalizeRunUnlocked(
      paths,
      repositoryRoot,
      runRecord,
      assistantEvent,
    );
  });
}

export async function recoverRuns(repositoryRoot, sessionId) {
  return withSessionLock(repositoryRoot, sessionId, async (paths) => {
    const ledger = await readLedgerUnlocked(paths);
    return recoverReadyRunsUnlocked(paths, repositoryRoot, ledger);
  });
}

export async function captureHookEvent(repositoryRoot, hookInput) {
  const eventName = hookInput.hook_event_name;
  const sessionId = hookInput.session_id;
  const turnId = hookInput.turn_id || null;
  let event;

  if (!sessionId) {
    throw new Error("Hook input is missing session_id");
  }

  switch (eventName) {
    case "SessionStart":
      event = await appendEvent(repositoryRoot, {
        sessionId,
        turnId,
        eventType: "session_start",
        attributes: { source: hookInput.source || null },
      });
      break;
    case "SessionEnd":
      event = await appendEvent(repositoryRoot, {
        sessionId,
        turnId,
        eventType: "session_end",
        attributes: { reason: hookInput.reason || null },
      });
      break;
    case "UserPromptSubmit": {
      const advisorTrigger = isAdvisorTrigger(hookInput.prompt);
      event = await appendEvent(repositoryRoot, {
        sessionId,
        turnId,
        eventType: "user_prompt",
        content: hookInput.prompt || "",
        attributes: {
          advisor_trigger: advisorTrigger,
          advisor_internal: advisorTrigger,
        },
      });
      break;
    }
    case "Stop": {
      const paths = sessionPaths(repositoryRoot, sessionId);
      const runRecord = await findRunByTurnUnlocked(paths, turnId);
      const advisorInternal = Boolean(runRecord);
      event = await appendEvent(repositoryRoot, {
        sessionId,
        turnId,
        eventType: "assistant_message",
        content: hookInput.last_assistant_message || "",
        attributes: { advisor_internal: advisorInternal },
      });
      await finalizeReadyRun(repositoryRoot, sessionId, turnId, event);
      break;
    }
    case "PreCompact":
    case "PostCompact":
      event = await appendEvent(repositoryRoot, {
        sessionId,
        turnId,
        eventType:
          eventName === "PreCompact" ? "pre_compact" : "post_compact",
        attributes: { trigger: hookInput.trigger || null },
      });
      break;
    default:
      return null;
  }

  return event;
}

export async function purgeState(repositoryRoot, sessionId = null) {
  const root = runtimeRoot(repositoryRoot);
  const target = sessionId
    ? sessionPaths(repositoryRoot, sessionId).sessionDirectory
    : root;
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Refusing to purge outside advisor runtime root");
  }
  await rm(target, { recursive: true, force: true });
  return target;
}

export async function readHookInput(stream = process.stdin) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    throw new Error("Hook received empty stdin");
  }
  return JSON.parse(raw);
}
