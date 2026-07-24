import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  appendEvent,
  captureHookEvent,
  markRunReady,
  prepareRun,
  purgeState,
  recoverRuns,
  redactSensitiveText,
  sessionPaths,
  validateLedger,
} from "../../.agents/skills/session-artifact-advisor/scripts/session-advisor-core.mjs";

async function createRepository(t) {
  const repositoryRoot = await mkdtemp(
    path.join(tmpdir(), "qa-gym-session-advisor-"),
  );
  await mkdir(path.join(repositoryRoot, ".git"));
  t.after(() => rm(repositoryRoot, { recursive: true, force: true }));
  return repositoryRoot;
}

async function createHookRepository(t) {
  const repositoryRoot = await mkdtemp(
    path.join(tmpdir(), "qa-gym-session-advisor-hook-"),
  );
  t.after(() => rm(repositoryRoot, { recursive: true, force: true }));
  const git = spawnSync("git", ["init", "--quiet"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(git.status, 0, git.stderr);

  const hookDirectory = path.join(repositoryRoot, ".codex", "hooks");
  const scriptDirectory = path.join(
    repositoryRoot,
    ".agents",
    "skills",
    "session-artifact-advisor",
    "scripts",
  );
  await mkdir(hookDirectory, { recursive: true });
  await mkdir(scriptDirectory, { recursive: true });
  await copyFile(
    ".codex/hooks/session-artifact-advisor-hook.mjs",
    path.join(hookDirectory, "session-artifact-advisor-hook.mjs"),
  );
  await copyFile(
    ".agents/skills/session-artifact-advisor/scripts/session-advisor-core.mjs",
    path.join(scriptDirectory, "session-advisor-core.mjs"),
  );
  return repositoryRoot;
}

function hookInput(repositoryRoot, values) {
  return {
    session_id: values.sessionId,
    turn_id: values.turnId || null,
    cwd: repositoryRoot,
    hook_event_name: values.event,
    ...values.extra,
  };
}

async function capture(repositoryRoot, values) {
  return captureHookEvent(repositoryRoot, hookInput(repositoryRoot, values));
}

test("redacts common credentials before persistence", () => {
  const input = [
    "api_key=super-secret-value",
    "Authorization: Bearer abcdefghijklmnopqrstuvwxyz",
    "https://reader:password@example.test",
    "sk-abcdefghijklmnop1234567890",
  ].join("\n");

  const redacted = redactSensitiveText(input);

  assert.doesNotMatch(redacted, /super-secret-value/);
  assert.doesNotMatch(redacted, /abcdefghijklmnopqrstuvwxyz/);
  assert.doesNotMatch(redacted, /reader:password/);
  assert.doesNotMatch(redacted, /sk-abcdefghijklmnop/);
  assert.match(redacted, /\[REDACTED/);
});

test("skill metadata is explicit, complete, and opt-in", async () => {
  const skill = await readFile(
    ".agents/skills/session-artifact-advisor/SKILL.md",
    "utf8",
  );
  const metadata = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(metadata, "SKILL.md must have YAML frontmatter");
  const keys = metadata[1]
    .split(/\r?\n/)
    .filter((line) => /^[a-z]/.test(line))
    .map((line) => line.slice(0, line.indexOf(":")));
  assert.deepEqual(keys, ["name", "description"]);
  assert.match(metadata[1], /name: session-artifact-advisor/);
  assert.match(metadata[1], /\$session-artifact-advisor/);
  assert.doesNotMatch(skill, /TODO/);
  assert.ok(skill.split(/\r?\n/).length < 500);

  const interfaceMetadata = await readFile(
    ".agents/skills/session-artifact-advisor/agents/openai.yaml",
    "utf8",
  );
  assert.match(interfaceMetadata, /allow_implicit_invocation: false/);
  assert.match(interfaceMetadata, /\$session-artifact-advisor/);

  const hookConfiguration = JSON.parse(
    await readFile(".codex/hooks.json", "utf8"),
  );
  assert.deepEqual(
    Object.keys(hookConfiguration.hooks).sort(),
    [
      "PostCompact",
      "PreCompact",
      "SessionEnd",
      "SessionStart",
      "Stop",
      "UserPromptSubmit",
    ],
  );
});

test("captures ordered hash-chained redacted events", async (t) => {
  const repositoryRoot = await createRepository(t);
  const sessionId = "session-capture";

  await capture(repositoryRoot, {
    sessionId,
    event: "SessionStart",
    extra: { source: "startup" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-1",
    event: "UserPromptSubmit",
    extra: { prompt: "Use api_key=never-store-this" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-1",
    event: "Stop",
    extra: { last_assistant_message: "Completed safely." },
  });

  const ledger = await validateLedger(repositoryRoot, sessionId);
  assert.equal(ledger.ok, true);
  assert.deepEqual(
    ledger.events.map((event) => event.seq),
    [1, 2, 3],
  );
  assert.equal(ledger.events[1].prev_hash, ledger.events[0].hash);
  assert.doesNotMatch(ledger.events[1].content, /never-store-this/);
});

test("hook emits exact trigger context", async (t) => {
  const repositoryRoot = await createRepository(t);
  const hookPath = path.resolve(
    ".codex/hooks/session-artifact-advisor-hook.mjs",
  );
  const input = hookInput(repositoryRoot, {
    sessionId: "session-hook",
    turnId: "turn-hook",
    event: "UserPromptSubmit",
    extra: { prompt: "Run $session-artifact-advisor now." },
  });

  const result = spawnSync(process.execPath, [hookPath], {
    input: JSON.stringify(input),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(
    output.hookSpecificOutput.hookEventName,
    "UserPromptSubmit",
  );
  assert.match(output.hookSpecificOutput.additionalContext, /session-hook/);
  assert.match(output.hookSpecificOutput.additionalContext, /turn-hook/);
});

test("configured hook command resolves the repository root", async (t) => {
    const configuration = JSON.parse(
      await readFile(".codex/hooks.json", "utf8"),
    );
    const command =
      configuration.hooks.UserPromptSubmit[0].hooks[0].command;
    const sessionId = `session-windows-command-${process.pid}`;
    const repositoryRoot = await createHookRepository(t);
    const nestedWorkingDirectory = path.join(repositoryRoot, "nested", "work");
    await mkdir(nestedWorkingDirectory, { recursive: true });
    const input = hookInput(nestedWorkingDirectory, {
      sessionId,
      turnId: "turn-windows-command",
      event: "UserPromptSubmit",
      extra: { prompt: "$session-artifact-advisor" },
    });

    try {
      const result = spawnSync(command, {
        shell: true,
        cwd: nestedWorkingDirectory,
        input: JSON.stringify(input),
        encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
      const ledger = await validateLedger(repositoryRoot, sessionId);
      assert.equal(
        ledger.events.length,
        1,
        JSON.stringify({
          stdout: result.stdout,
          stderr: result.stderr,
          command,
        }),
      );
      assert.match(result.stdout, /session-windows-command/);
    } finally {
      await purgeState(repositoryRoot, sessionId);
    }
});

test("finalizes a delta and reports a later semantic no-op", async (t) => {
  const repositoryRoot = await createRepository(t);
  const sessionId = "session-flow";

  await capture(repositoryRoot, {
    sessionId,
    event: "SessionStart",
    extra: { source: "startup" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-1",
    event: "UserPromptSubmit",
    extra: { prompt: "Please keep this workflow." },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-1",
    event: "Stop",
    extra: { last_assistant_message: "I will use it." },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-2",
    event: "UserPromptSubmit",
    extra: { prompt: "$session-artifact-advisor checkpoint" },
  });

  const prepared = await prepareRun(repositoryRoot, sessionId, "turn-2");
  assert.equal(prepared.event_count, 2);
  assert.equal(prepared.no_op, false);
  assert.equal(prepared.continuity.status, "exact");

  await markRunReady(repositoryRoot, sessionId, "turn-2", ["saa-proposal-001"]);
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-2",
    event: "Stop",
    extra: { last_assistant_message: "Checkpoint complete." },
  });

  const checkpoint = JSON.parse(
    await readFile(sessionPaths(repositoryRoot, sessionId).checkpoint, "utf8"),
  );
  assert.equal(checkpoint.covered_event_seq, 5);
  assert.deepEqual(checkpoint.proposal_ids, ["saa-proposal-001"]);

  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-3",
    event: "UserPromptSubmit",
    extra: { prompt: "$session-artifact-advisor checkpoint" },
  });
  const noOp = await prepareRun(repositoryRoot, sessionId, "turn-3");
  assert.equal(noOp.event_count, 0);
  assert.equal(noOp.no_op, true);
});

test("keeps session cursors isolated", async (t) => {
  const repositoryRoot = await createRepository(t);

  for (const sessionId of ["session-a", "session-b"]) {
    await capture(repositoryRoot, {
      sessionId,
      event: "SessionStart",
      extra: { source: "startup" },
    });
    await capture(repositoryRoot, {
      sessionId,
      turnId: `${sessionId}-turn-1`,
      event: "UserPromptSubmit",
      extra: { prompt: `content for ${sessionId}` },
    });
    await capture(repositoryRoot, {
      sessionId,
      turnId: `${sessionId}-turn-1`,
      event: "Stop",
      extra: { last_assistant_message: `answer for ${sessionId}` },
    });
    await capture(repositoryRoot, {
      sessionId,
      turnId: `${sessionId}-trigger`,
      event: "UserPromptSubmit",
      extra: { prompt: "$session-artifact-advisor" },
    });
  }

  const first = await prepareRun(
    repositoryRoot,
    "session-a",
    "session-a-trigger",
  );
  const second = await prepareRun(
    repositoryRoot,
    "session-b",
    "session-b-trigger",
  );

  assert.equal(first.event_count, 2);
  assert.equal(second.event_count, 2);
  assert.notEqual(first.delta_path, second.delta_path);
});

test("records compaction boundaries without adding analyzable events", async (t) => {
  const repositoryRoot = await createRepository(t);
  const sessionId = "session-compact";

  await capture(repositoryRoot, {
    sessionId,
    event: "SessionStart",
    extra: { source: "startup" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-compact",
    event: "PreCompact",
    extra: { trigger: "auto" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-compact",
    event: "PostCompact",
    extra: { trigger: "auto" },
  });

  const ledger = await validateLedger(repositoryRoot, sessionId);
  assert.deepEqual(
    ledger.events.map((event) => event.event_type),
    ["session_start", "pre_compact", "post_compact"],
  );
});

test("marks a tampered hash chain as degraded continuity", async (t) => {
  const repositoryRoot = await createRepository(t);
  const sessionId = "session-tampered";

  await capture(repositoryRoot, {
    sessionId,
    event: "SessionStart",
    extra: { source: "startup" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-1",
    event: "UserPromptSubmit",
    extra: { prompt: "original content" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-1",
    event: "Stop",
    extra: { last_assistant_message: "answer" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-trigger",
    event: "UserPromptSubmit",
    extra: { prompt: "$session-artifact-advisor" },
  });

  const eventsPath = sessionPaths(repositoryRoot, sessionId).events;
  const lines = (await readFile(eventsPath, "utf8")).trim().split("\n");
  const tampered = JSON.parse(lines[1]);
  tampered.content = "changed after hashing";
  lines[1] = JSON.stringify(tampered);
  await writeFile(eventsPath, `${lines.join("\n")}\n`, "utf8");

  const prepared = await prepareRun(
    repositoryRoot,
    sessionId,
    "turn-trigger",
  );
  assert.equal(prepared.continuity.status, "degraded");
  assert.match(prepared.continuity.reason, /invalid_hash/);
});

test("marks a resumed pre-hook session as degraded bootstrap", async (t) => {
  const repositoryRoot = await createRepository(t);
  const sessionId = "session-bootstrap";

  await capture(repositoryRoot, {
    sessionId,
    event: "SessionStart",
    extra: { source: "resume" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-trigger",
    event: "UserPromptSubmit",
    extra: { prompt: "$session-artifact-advisor" },
  });

  const prepared = await prepareRun(
    repositoryRoot,
    sessionId,
    "turn-trigger",
  );
  assert.equal(prepared.bootstrap, true);
  assert.equal(prepared.continuity.status, "degraded");
  assert.equal(
    prepared.continuity.reason,
    "pre_hook_history_unavailable",
  );
});

test("supersedes an interrupted prepared run without analyzing advisor output", async (t) => {
  const repositoryRoot = await createRepository(t);
  const sessionId = "session-interrupted";

  await capture(repositoryRoot, {
    sessionId,
    event: "SessionStart",
    extra: { source: "startup" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-1",
    event: "UserPromptSubmit",
    extra: { prompt: "A reusable correction." },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-1",
    event: "Stop",
    extra: { last_assistant_message: "Correction accepted." },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-failed",
    event: "UserPromptSubmit",
    extra: { prompt: "$session-artifact-advisor" },
  });
  await prepareRun(repositoryRoot, sessionId, "turn-failed");
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-failed",
    event: "Stop",
    extra: { last_assistant_message: "Analysis interrupted." },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-retry",
    event: "UserPromptSubmit",
    extra: { prompt: "$session-artifact-advisor" },
  });

  const retried = await prepareRun(
    repositoryRoot,
    sessionId,
    "turn-retry",
  );
  const delta = JSON.parse(await readFile(retried.delta_path, "utf8"));

  assert.equal(retried.event_count, 2);
  assert.deepEqual(
    delta.events.map((event) => event.turn_id),
    ["turn-1", "turn-1"],
  );
});

test("recovers a ready run when its assistant event was already captured", async (t) => {
  const repositoryRoot = await createRepository(t);
  const sessionId = "session-recovery";

  await capture(repositoryRoot, {
    sessionId,
    event: "SessionStart",
    extra: { source: "startup" },
  });
  await capture(repositoryRoot, {
    sessionId,
    turnId: "turn-trigger",
    event: "UserPromptSubmit",
    extra: { prompt: "$session-artifact-advisor" },
  });
  await prepareRun(repositoryRoot, sessionId, "turn-trigger");
  await markRunReady(repositoryRoot, sessionId, "turn-trigger");
  await appendEvent(repositoryRoot, {
    sessionId,
    turnId: "turn-trigger",
    eventType: "assistant_message",
    content: "Captured before finalization.",
    attributes: { advisor_internal: true },
  });

  const recovered = await recoverRuns(repositoryRoot, sessionId);
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].covered_event_seq, 3);
});

test("purges only the explicitly selected session", async (t) => {
  const repositoryRoot = await createRepository(t);

  await appendEvent(repositoryRoot, {
    sessionId: "session-keep",
    eventType: "session_start",
  });
  await appendEvent(repositoryRoot, {
    sessionId: "session-purge",
    eventType: "session_start",
  });

  await purgeState(repositoryRoot, "session-purge");

  const kept = await validateLedger(repositoryRoot, "session-keep");
  const purged = await validateLedger(repositoryRoot, "session-purge");
  assert.equal(kept.events.length, 1);
  assert.equal(purged.events.length, 0);
});
