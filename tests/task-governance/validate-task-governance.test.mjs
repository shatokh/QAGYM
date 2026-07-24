import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { validateRepository } from "../../scripts/validate-task-governance.mjs";

const temporaryRoots = [];

function createRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "qagym-governance-"));
  temporaryRoots.push(root);
  return root;
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, ...relativePath.split("/"));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
}

function taskMarkdown(id, options = {}) {
  const numericId = Number.parseInt(id, 10);
  const status = options.status ?? "Done";
  const behaviorType = options.behaviorType ?? "Infrastructure";
  const priority = options.priority ?? "P2 Normal";
  const workOrigin = options.workOrigin ?? "Roadmap";
  const titleId = options.titleId ?? id;
  const includeApproval =
    options.includeApproval ?? numericId >= 10;
  const includeCommit =
    options.includeCommit ?? (numericId >= 6 && status === "Done");
  const includeUnplannedRecord = options.includeUnplannedRecord ?? true;
  const parts = [
    `# Task ${titleId}: Fixture Task`,
    "",
    "## Status",
    "",
    status,
  ];

  if (includeApproval) {
    parts.push(
      "",
      "## Approval Record",
      "",
      `- Approved by: ${options.approvedBy ?? "Human project owner."}`,
      `- Approval reference: ${options.approvalReference ?? "Fixture approval."}`,
      "- Approved scope notes: Fixture.",
    );
  }

  parts.push("", "## Behavior Type", "", behaviorType);

  if (numericId >= 19 || options.includePriority) {
    parts.push(
      "",
      "## Priority",
      "",
      `\`${priority}\``,
      "",
      "## Work Origin",
      "",
      `\`${workOrigin}\``,
    );
  }

  if (workOrigin === "Urgent Unplanned" && includeUnplannedRecord) {
    parts.push(
      "",
      "## Unplanned Work Record",
      "",
      "- Discovery date and source: Fixture.",
      "- Affected paths: Fixture.",
      "- Human disposition: Pending.",
    );
  }

  if (includeCommit) {
    parts.push(
      "",
      "## Commit Decision",
      "",
      options.commitDecision ?? "Commit after this task.",
    );
  }

  return parts.join("\n");
}

function writeTask(root, id, options = {}) {
  const filename = options.filename ?? `${id}-fixture-task.md`;
  writeFile(root, `docs/tasks/${filename}`, taskMarkdown(id, options));
}

function writeProgress(root, options = {}) {
  const active = options.active ?? "None.";
  const done = options.done ?? "None.";
  const extra = options.extra ?? "";
  writeFile(
    root,
    "PROGRESS.md",
    `# Progress

## Active Tasks

${active}

## Priority Queue

${options.priorityQueue ?? "None."}

## Unplanned Work Reconciliation

None.

## Done

${done}

${extra}`,
  );
}

function messages(result) {
  return result.findings.map(
    (finding) => `${finding.path}: ${finding.message}`,
  );
}

function snapshotFiles(root) {
  const snapshot = new Map();

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else {
        snapshot.set(
          path.relative(root, entryPath),
          fs.readFileSync(entryPath, "utf8"),
        );
      }
    }
  }

  visit(root);
  return snapshot;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    const resolvedRoot = path.resolve(root);
    assert.ok(resolvedRoot.startsWith(path.resolve(os.tmpdir())));
    fs.rmSync(resolvedRoot, { recursive: true, force: true });
  }
});

test("accepts a valid repository across schema eras", () => {
  const root = createRoot();
  writeTask(root, "0001", { includeApproval: false, includeCommit: false });
  writeTask(root, "0006", { includeApproval: false });
  writeTask(root, "0010");
  writeTask(root, "0019", {
    priority: "P1 High",
    status: "In Progress",
    workOrigin: "Advisor Proposal",
  });
  writeProgress(root, {
    active: "- `0019` - Active fixture.",
    priorityQueue: "- P1 High: `0019`.",
    done: "- `0010` - Completed fixture.",
  });
  writeFile(
    root,
    "docs/ai/session-advisor/proposals/saa-skill-fixture.md",
    `# Fixture Proposal

- Status: \`accepted\`

Implementation task:
\`docs/tasks/0019-fixture-task.md\`.`,
  );

  assert.deepEqual(validateRepository(root).findings, []);
});

test("does not modify repository files while validating", () => {
  const root = createRoot();
  writeTask(root, "0019", { status: "Draft" });
  writeProgress(root);
  const before = snapshotFiles(root);

  validateRepository(root);

  assert.deepEqual(snapshotFiles(root), before);
});

test("rejects a title ID that differs from the filename", () => {
  const root = createRoot();
  writeTask(root, "0019", { status: "Draft", titleId: "0020" });
  writeProgress(root);

  assert.ok(
    messages(validateRepository(root)).some((message) =>
      message.includes("title task ID 0020 does not match filename ID 0019"),
    ),
  );
});

test("rejects duplicate task IDs", () => {
  const root = createRoot();
  writeTask(root, "0019", {
    filename: "0019-first.md",
    status: "Draft",
  });
  writeTask(root, "0019", {
    filename: "0019-second.md",
    status: "Draft",
  });
  writeProgress(root);

  assert.ok(
    messages(validateRepository(root)).some((message) =>
      message.includes("task ID 0019 duplicates"),
    ),
  );
});

test("rejects invalid status and behavior type values", () => {
  const root = createRoot();
  writeTask(root, "0019", {
    behaviorType: "Feature",
    status: "Started",
  });
  writeProgress(root);
  const resultMessages = messages(validateRepository(root));

  assert.ok(resultMessages.some((message) => message.includes("invalid Status")));
  assert.ok(
    resultMessages.some((message) => message.includes("invalid Behavior Type")),
  );
});

test("requires approval metadata from task 0010", () => {
  const root = createRoot();
  writeTask(root, "0010", { includeApproval: false });
  writeProgress(root);

  assert.ok(
    messages(validateRepository(root)).some((message) =>
      message.includes("requires non-pending Approved by"),
    ),
  );
});

test("grandfathers approval metadata before task 0010", () => {
  const root = createRoot();
  writeTask(root, "0009", { includeApproval: false });
  writeProgress(root);

  assert.deepEqual(validateRepository(root).findings, []);
});

test("requires a resolved commit decision from task 0006", () => {
  const root = createRoot();
  writeTask(root, "0006", {
    commitDecision: "Pending human decision.",
  });
  writeProgress(root);

  assert.ok(
    messages(validateRepository(root)).some((message) =>
      message.includes("requires a resolved Commit Decision"),
    ),
  );
});

test("accepts resolved historical commit decision wording", () => {
  const root = createRoot();
  writeTask(root, "0008", {
    commitDecision:
      "Committed as `abcdef0 infra: fixture` after explicit human approval.",
  });
  writeTask(root, "0014", {
    commitDecision:
      "Commit separately after task completion. Approved by the human.",
  });
  writeTask(root, "0015", {
    commitDecision:
      "Approved by the human project owner. Commit task `0015` separately.",
  });
  writeProgress(root);

  assert.deepEqual(validateRepository(root).findings, []);
});

test("grandfathers commit decisions before task 0006", () => {
  const root = createRoot();
  writeTask(root, "0005", {
    includeApproval: false,
    includeCommit: false,
  });
  writeProgress(root);

  assert.deepEqual(validateRepository(root).findings, []);
});

test("requires allowed priority and work origin from task 0019", () => {
  const root = createRoot();
  writeTask(root, "0019", {
    priority: "Urgent",
    status: "Draft",
    workOrigin: "Other",
  });
  writeProgress(root);
  const resultMessages = messages(validateRepository(root));

  assert.ok(
    resultMessages.some((message) => message.includes("invalid Priority")),
  );
  assert.ok(
    resultMessages.some((message) => message.includes("invalid Work Origin")),
  );
});

test("requires unresolved P0 and P1 tasks in the progress tracker", () => {
  const root = createRoot();
  writeTask(root, "0019", {
    priority: "P1 High",
    status: "In Progress",
  });
  writeProgress(root);

  assert.ok(
    messages(validateRepository(root)).some((message) =>
      message.includes("unresolved P1 High task 0019 is not visible"),
    ),
  );
});

test("requires an Unplanned Work Record for urgent unplanned tasks", () => {
  const root = createRoot();
  writeTask(root, "0019", {
    includeUnplannedRecord: false,
    priority: "P1 High",
    status: "Draft",
    workOrigin: "Urgent Unplanned",
  });
  writeProgress(root, {
    priorityQueue: "- P1 High: `0019`.",
  });

  assert.ok(
    messages(validateRepository(root)).some((message) =>
      message.includes("requires a non-empty Unplanned Work Record"),
    ),
  );
});

test("rejects missing task references and active/done overlap in progress", () => {
  const root = createRoot();
  writeTask(root, "0019");
  writeProgress(root, {
    active: "- `0019` - Active fixture.",
    done: "- `0019` - Done fixture.\n- `9999` - Missing fixture.",
  });
  const resultMessages = messages(validateRepository(root));

  assert.ok(
    resultMessages.some((message) =>
      message.includes("references missing task 9999"),
    ),
  );
  assert.ok(
    resultMessages.some((message) =>
      message.includes("listed in both Active Tasks and Done"),
    ),
  );
});

test("requires accepted proposals to reference an implementation task", () => {
  const root = createRoot();
  writeTask(root, "0019");
  writeProgress(root);
  writeFile(
    root,
    "docs/ai/session-advisor/proposals/saa-script-fixture.md",
    `# Fixture Proposal

- Status: \`accepted\`

No implementation link has been assigned.`,
  );

  assert.ok(
    messages(validateRepository(root)).some((message) =>
      message.includes("accepted proposal must reference"),
    ),
  );
});
