import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TASK_FILE_PATTERN = /^(\d{4})-(.+)\.md$/;
const TASK_TITLE_PATTERN = /^# Task (\d{4}):\s+.+$/m;

const ALLOWED_STATUSES = new Set([
  "Draft",
  "Ready for Review",
  "Approved",
  "In Progress",
  "In Review",
  "Changes Requested",
  "Done",
]);

const APPROVAL_REQUIRED_STATUSES = new Set([
  "Approved",
  "In Progress",
  "In Review",
  "Changes Requested",
  "Done",
]);

const ALLOWED_BEHAVIOR_TYPES = new Set([
  "Clean Feature",
  "Planned Bug",
  "Bugfix",
  "Refactor",
  "Docs Only",
  "Infrastructure",
  "Test Only",
]);

const ALLOWED_PRIORITIES = new Set([
  "P0 Critical",
  "P1 High",
  "P2 Normal",
  "P3 Low",
]);

const ALLOWED_WORK_ORIGINS = new Set([
  "Roadmap",
  "Urgent Unplanned",
  "Maintenance",
  "Advisor Proposal",
]);

const APPROVAL_REQUIRED_FROM = 10;
const COMMIT_DECISION_REQUIRED_FROM = 6;
const PRIORITY_REQUIRED_FROM = 19;

function toDisplayPath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

export function readSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const marker = `## ${heading}`;
  const start = lines.findIndex((line) => line.trim() === marker);

  if (start === -1) {
    return null;
  }

  const body = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      break;
    }
    body.push(lines[index]);
  }

  return body.join("\n").trim();
}

function scalarValue(section) {
  if (section === null) {
    return null;
  }

  const firstLine = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "";
  }

  const inlineCode = firstLine.match(/^`([^`]+)`$/);
  return inlineCode ? inlineCode[1] : firstLine;
}

function metadataValue(section, label) {
  if (section === null) {
    return null;
  }

  const pattern = new RegExp(`^- ${label}:\\s*(.+)$`, "im");
  return section.match(pattern)?.[1]?.trim() ?? null;
}

function extractTaskIds(markdown) {
  return new Set(
    [...markdown.matchAll(/`(\d{4})`/g)].map((match) => match[1]),
  );
}

function isResolvedCommitDecision(section) {
  if (!section) {
    return false;
  }

  const value = section.replace(/\s+/g, " ").trim();
  if (/^Pending human decision\b/i.test(value)) {
    return false;
  }

  return (
    /^Commit after this task\b/i.test(value) ||
    /^Group with task \d{4}\b/i.test(value) ||
    /^No commit required\b/i.test(value) ||
    /^Committed as `[^`]+`/i.test(value) ||
    /^Commit separately\b/i.test(value) ||
    /\bCommit task `?\d{4}`? separately\b/i.test(value)
  );
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function readTaskRecords(root, findings) {
  const tasksDirectory = path.join(root, "docs", "tasks");
  if (!fs.existsSync(tasksDirectory)) {
    findings.push({
      path: "docs/tasks",
      message: "task directory does not exist",
    });
    return [];
  }

  const records = [];
  const ids = new Map();
  const filenames = fs
    .readdirSync(tasksDirectory)
    .filter((filename) => TASK_FILE_PATTERN.test(filename))
    .sort();

  for (const filename of filenames) {
    const filePath = path.join(tasksDirectory, filename);
    const displayPath = toDisplayPath(root, filePath);
    const markdown = fs.readFileSync(filePath, "utf8");
    const filenameMatch = filename.match(TASK_FILE_PATTERN);
    const filenameId = filenameMatch[1];
    const numericId = Number.parseInt(filenameId, 10);
    const titleId = markdown.match(TASK_TITLE_PATTERN)?.[1] ?? null;
    const status = scalarValue(readSection(markdown, "Status"));
    const behaviorType = scalarValue(readSection(markdown, "Behavior Type"));
    const priority = scalarValue(readSection(markdown, "Priority"));
    const workOrigin = scalarValue(readSection(markdown, "Work Origin"));

    if (ids.has(filenameId)) {
      findings.push({
        path: displayPath,
        message: `task ID ${filenameId} duplicates ${ids.get(filenameId)}`,
      });
    } else {
      ids.set(filenameId, displayPath);
    }

    if (titleId === null) {
      findings.push({
        path: displayPath,
        message: "title must use '# Task NNNN: <title>'",
      });
    } else if (titleId !== filenameId) {
      findings.push({
        path: displayPath,
        message: `title task ID ${titleId} does not match filename ID ${filenameId}`,
      });
    }

    if (!ALLOWED_STATUSES.has(status)) {
      findings.push({
        path: displayPath,
        message: `invalid Status '${status ?? "<missing>"}'`,
      });
    }

    if (!ALLOWED_BEHAVIOR_TYPES.has(behaviorType)) {
      findings.push({
        path: displayPath,
        message: `invalid Behavior Type '${behaviorType ?? "<missing>"}'`,
      });
    }

    if (numericId >= PRIORITY_REQUIRED_FROM) {
      if (!ALLOWED_PRIORITIES.has(priority)) {
        findings.push({
          path: displayPath,
          message: `invalid Priority '${priority ?? "<missing>"}'`,
        });
      }

      if (!ALLOWED_WORK_ORIGINS.has(workOrigin)) {
        findings.push({
          path: displayPath,
          message: `invalid Work Origin '${workOrigin ?? "<missing>"}'`,
        });
      }
    }

    if (
      numericId >= APPROVAL_REQUIRED_FROM &&
      APPROVAL_REQUIRED_STATUSES.has(status)
    ) {
      const approval = readSection(markdown, "Approval Record");
      const approvedBy = metadataValue(approval, "Approved by");
      const approvalReference = metadataValue(approval, "Approval reference");

      if (
        !approvedBy ||
        /^Pending\b/i.test(approvedBy) ||
        !approvalReference ||
        /^Pending\b/i.test(approvalReference)
      ) {
        findings.push({
          path: displayPath,
          message:
            "approved-or-later task requires non-pending Approved by and Approval reference values",
        });
      }
    }

    if (numericId >= COMMIT_DECISION_REQUIRED_FROM && status === "Done") {
      const commitDecision = readSection(markdown, "Commit Decision");
      if (!isResolvedCommitDecision(commitDecision)) {
        findings.push({
          path: displayPath,
          message: "Done task requires a resolved Commit Decision",
        });
      }
    }

    if (numericId >= PRIORITY_REQUIRED_FROM && workOrigin === "Urgent Unplanned") {
      const record = scalarValue(readSection(markdown, "Unplanned Work Record"));
      if (!record || /^None\.?$/i.test(record)) {
        findings.push({
          path: displayPath,
          message:
            "Urgent Unplanned task requires a non-empty Unplanned Work Record",
        });
      }
    }

    records.push({
      displayPath,
      filenameId,
      markdown,
      numericId,
      priority,
      status,
      workOrigin,
    });
  }

  return records;
}

function validateProgress(root, tasks, findings) {
  const progressPath = path.join(root, "PROGRESS.md");
  if (!fs.existsSync(progressPath)) {
    findings.push({
      path: "PROGRESS.md",
      message: "progress tracker does not exist",
    });
    return;
  }

  const markdown = fs.readFileSync(progressPath, "utf8");
  const allIds = extractTaskIds(markdown);
  const activeIds = extractTaskIds(readSection(markdown, "Active Tasks") ?? "");
  const doneIds = extractTaskIds(readSection(markdown, "Done") ?? "");
  const knownIds = new Set(tasks.map((task) => task.filenameId));

  for (const taskId of allIds) {
    if (!knownIds.has(taskId)) {
      findings.push({
        path: "PROGRESS.md",
        message: `references missing task ${taskId}`,
      });
    }
  }

  for (const taskId of activeIds) {
    if (doneIds.has(taskId)) {
      findings.push({
        path: "PROGRESS.md",
        message: `task ${taskId} is listed in both Active Tasks and Done`,
      });
    }
  }

  for (const task of tasks) {
    const isUnresolvedHighPriority =
      task.status !== "Done" &&
      (task.priority === "P0 Critical" || task.priority === "P1 High");

    if (isUnresolvedHighPriority && !allIds.has(task.filenameId)) {
      findings.push({
        path: "PROGRESS.md",
        message: `unresolved ${task.priority} task ${task.filenameId} is not visible`,
      });
    }
  }
}

function validateAcceptedProposals(root, findings) {
  const proposalsDirectory = path.join(
    root,
    "docs",
    "ai",
    "session-advisor",
    "proposals",
  );

  if (!fs.existsSync(proposalsDirectory)) {
    return 0;
  }

  const proposalFiles = fs
    .readdirSync(proposalsDirectory)
    .filter((filename) => filename.endsWith(".md") && filename !== "index.md")
    .sort();

  for (const filename of proposalFiles) {
    const filePath = path.join(proposalsDirectory, filename);
    const displayPath = toDisplayPath(root, filePath);
    const markdown = fs.readFileSync(filePath, "utf8");
    const status = markdown.match(/^- Status:\s*`([^`]+)`\s*$/im)?.[1] ?? null;

    if (status !== "accepted") {
      continue;
    }

    const taskReferences = [
      ...markdown.matchAll(/`(docs\/tasks\/\d{4}-[^`]+\.md)`/g),
    ].map((match) => match[1]);
    const explicitlyPending = /task creation is pending/i.test(markdown);

    if (taskReferences.length === 0 && !explicitlyPending) {
      findings.push({
        path: displayPath,
        message:
          "accepted proposal must reference an implementation task or state that task creation is pending",
      });
      continue;
    }

    for (const taskReference of taskReferences) {
      if (!fs.existsSync(path.join(root, ...taskReference.split("/")))) {
        findings.push({
          path: displayPath,
          message: `references missing implementation task ${taskReference}`,
        });
      }
    }
  }

  return proposalFiles.length;
}

export function validateRepository(root = process.cwd()) {
  const resolvedRoot = path.resolve(root);
  const findings = [];
  const tasks = readTaskRecords(resolvedRoot, findings);
  validateProgress(resolvedRoot, tasks, findings);
  const proposalCount = validateAcceptedProposals(resolvedRoot, findings);

  findings.sort((left, right) => {
    const pathOrder = compareText(left.path, right.path);
    return pathOrder !== 0
      ? pathOrder
      : compareText(left.message, right.message);
  });

  return {
    findings,
    proposalCount,
    taskCount: tasks.length,
  };
}

function runCli() {
  const root = process.argv[2] ?? process.cwd();
  const result = validateRepository(root);

  if (result.findings.length === 0) {
    console.log(
      `Task governance validation passed (${result.taskCount} tasks, ${result.proposalCount} proposals).`,
    );
    return;
  }

  console.error(
    `Task governance validation failed with ${result.findings.length} finding(s):`,
  );
  for (const finding of result.findings) {
    console.error(`- ${finding.path}: ${finding.message}`);
  }
  process.exitCode = 1;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runCli();
}
