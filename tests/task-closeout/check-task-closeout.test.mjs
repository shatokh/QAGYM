import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import { validateTaskCloseout } from "../../scripts/check-task-closeout.mjs";

const temporaryRoots = [];

function createRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "qagym-closeout-"));
  temporaryRoots.push(root);
  return root;
}

function writeFile(root, relativePath, content) {
  const filePath = path.join(root, ...relativePath.split("/"));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
}

function writeTask(root, options = {}) {
  const id = options.id ?? "0029";
  writeFile(
    root,
    `docs/tasks/${id}-fixture-task.md`,
    `# Task ${id}: Fixture Task

## Status

${options.status ?? "Done"}

## Approval Record

- Approved by: ${options.approvedBy ?? "Human project owner."}
- Approval reference: ${options.approvalReference ?? "Fixture approval."}
- Approved scope notes: Fixture.

## Behavior Type

Infrastructure

## Priority

\`P2 Normal\`

## Work Origin

\`Advisor Proposal\`

## Commit Decision

${options.commitDecision ?? "Commit after this task."}`,
  );
}

function writeProgress(root, options = {}) {
  writeFile(
    root,
    "PROGRESS.md",
    `# Progress

## Active Tasks

${options.active ?? "None."}

## Done

${options.done ?? "- `0029` - Fixture task completed."}`,
  );
}

function writeAcceptedProposal(root, taskId = "0029") {
  writeFile(
    root,
    "docs/ai/session-advisor/proposals/saa-script-fixture.md",
    `# Fixture Proposal

## Metadata

- Proposal ID: \`saa-script-fixture\`
- Status: \`accepted\`

Implementation task: \`docs/tasks/${taskId}-fixture-task.md\`.`,
  );
}

function messages(result) {
  return result.findings.map((finding) => finding.message);
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    const resolvedRoot = path.resolve(root);
    assert.ok(resolvedRoot.startsWith(path.resolve(os.tmpdir())));
    fs.rmSync(resolvedRoot, { recursive: true, force: true });
  }
});

test("accepts a resolved Done task closeout", () => {
  const root = createRoot();
  writeTask(root);
  writeProgress(root);
  writeAcceptedProposal(root);

  const result = validateTaskCloseout(root, "0029", {
    skipGit: true,
    stagedFiles: [
      "docs/tasks/0029-fixture-task.md",
      "scripts/check-task-closeout.mjs",
    ],
  });

  assert.deepEqual(result.findings, []);
});

test("rejects a Done task with a pending commit decision", () => {
  const root = createRoot();
  writeTask(root, { commitDecision: "Pending human decision" });
  writeProgress(root);

  assert.ok(
    messages(validateTaskCloseout(root, "0029", { skipGit: true })).some(
      (message) => message.includes("unresolved Commit Decision"),
    ),
  );
});

test("rejects progress active and done overlap", () => {
  const root = createRoot();
  writeTask(root);
  writeProgress(root, {
    active: "- `0029` - Active fixture.",
    done: "- `0029` - Done fixture.",
  });

  assert.ok(
    messages(validateTaskCloseout(root, "0029", { skipGit: true })).some(
      (message) => message.includes("both Active Tasks and Done"),
    ),
  );
});

test("warns when an accepted proposal does not reference the task", () => {
  const root = createRoot();
  writeTask(root);
  writeProgress(root);
  writeAcceptedProposal(root, "0030");

  const result = validateTaskCloseout(root, "0029", { skipGit: true });

  assert.ok(
    result.findings.some(
      (finding) =>
        finding.severity === "warning" &&
        finding.message.includes("accepted proposal does not reference task 0029"),
    ),
  );
});

test("warns when staged files are outside standard closeout scope", () => {
  const root = createRoot();
  writeTask(root);
  writeProgress(root);

  const result = validateTaskCloseout(root, "0029", {
    skipGit: true,
    stagedFiles: ["apps/api/src/product.ts"],
  });

  assert.ok(
    result.findings.some(
      (finding) =>
        finding.severity === "warning" &&
        finding.message.includes("outside the standard closeout scope"),
    ),
  );
});
