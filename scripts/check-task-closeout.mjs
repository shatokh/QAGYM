import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  fileURLToPath(new URL("../", import.meta.url)),
);

const approvalRequiredStatuses = new Set([
  "Approved",
  "In Progress",
  "In Review",
  "Changes Requested",
  "Done",
]);

function toDisplayPath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function readSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const marker = `## ${heading}`;
  const start = lines.findIndex((line) => line.trim() === marker);

  if (start === -1) {
    return "";
  }

  const sectionLines = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      break;
    }
    sectionLines.push(lines[index]);
  }

  return sectionLines.join("\n").trim();
}

function scalarSection(markdown, heading) {
  return readSection(markdown, heading)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function isResolvedCommitDecision(section) {
  const value = section.replace(/\s+/g, " ").trim();
  if (!value || /^Pending human decision\b/i.test(value)) {
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

function approvalIsResolved(markdown) {
  const approval = readSection(markdown, "Approval Record");
  const approvedBy = approval.match(/^- Approved by:\s*(.+)$/im)?.[1]?.trim();
  const approvalReference = approval
    .match(/^- Approval reference:\s*(.+)$/im)?.[1]
    ?.trim();

  return Boolean(
    approvedBy &&
      approvalReference &&
      !/^Pending\b/i.test(approvedBy) &&
      !/^Pending\b/i.test(approvalReference),
  );
}

function findTaskFile(root, taskId) {
  const tasksDirectory = path.join(root, "docs", "tasks");
  if (!fs.existsSync(tasksDirectory)) {
    return null;
  }

  const filename = fs
    .readdirSync(tasksDirectory)
    .find((entry) => entry.startsWith(`${taskId}-`) && entry.endsWith(".md"));

  return filename ? path.join(tasksDirectory, filename) : null;
}

function readProgressMembership(root, taskId) {
  const progressPath = path.join(root, "PROGRESS.md");
  if (!fs.existsSync(progressPath)) {
    return { inActive: false, inDone: false, missing: true };
  }

  const markdown = fs.readFileSync(progressPath, "utf8");
  const active = readSection(markdown, "Active Tasks");
  const done = readSection(markdown, "Done");
  const taskPattern = new RegExp(`\`${taskId}\``);

  return {
    inActive: taskPattern.test(active),
    inDone: taskPattern.test(done),
    missing: false,
  };
}

function listAcceptedProposalFiles(root) {
  const proposalsDirectory = path.join(
    root,
    "docs",
    "ai",
    "session-advisor",
    "proposals",
  );

  if (!fs.existsSync(proposalsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(proposalsDirectory)
    .filter((filename) => filename.endsWith(".md") && filename !== "index.md")
    .map((filename) => path.join(proposalsDirectory, filename))
    .filter((filePath) => {
      const markdown = fs.readFileSync(filePath, "utf8");
      return /^- Status:\s*`accepted`\s*$/im.test(markdown);
    });
}

function proposalReferencesTask(markdown, taskId) {
  return new RegExp("`docs/tasks/" + taskId + "-[^`]+\\.md`").test(markdown);
}

function getStagedFiles(root) {
  try {
    return execFileSync("git", ["diff", "--cached", "--name-only"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

function stagedFilesLookRelevant(stagedFiles, taskId) {
  if (!stagedFiles || stagedFiles.length === 0) {
    return true;
  }

  const relevantPrefixes = [
    "AGENTS.md",
    "PROGRESS.md",
    ".agents/skills/",
    "docs/ai/session-advisor/proposals/",
    "scripts/",
    "tests/",
  ];

  return stagedFiles.every(
    (filePath) =>
      filePath.startsWith(`docs/tasks/${taskId}-`) ||
      relevantPrefixes.some((prefix) => filePath.startsWith(prefix)),
  );
}

export function validateTaskCloseout(root, taskId, options = {}) {
  const findings = [];
  const taskFile = findTaskFile(root, taskId);

  if (!/^\d{4}$/.test(taskId)) {
    findings.push({
      message: "Task ID must use four digits.",
      severity: "error",
    });
    return { findings, taskFile: null };
  }

  if (!taskFile) {
    findings.push({
      message: `Task ${taskId} file was not found under docs/tasks/.`,
      severity: "error",
    });
    return { findings, taskFile: null };
  }

  const markdown = fs.readFileSync(taskFile, "utf8");
  const displayPath = toDisplayPath(root, taskFile);
  const status = scalarSection(markdown, "Status");
  const commitDecision = readSection(markdown, "Commit Decision");

  if (approvalRequiredStatuses.has(status) && !approvalIsResolved(markdown)) {
    findings.push({
      message: `${displayPath}: approved-or-later task has unresolved approval metadata.`,
      severity: "error",
    });
  }

  if (status === "Done" && !isResolvedCommitDecision(commitDecision)) {
    findings.push({
      message: `${displayPath}: Done task has unresolved Commit Decision.`,
      severity: "error",
    });
  }

  const progress = readProgressMembership(root, taskId);
  if (progress.missing) {
    findings.push({
      message: "PROGRESS.md was not found.",
      severity: "error",
    });
  } else if (progress.inActive && progress.inDone) {
    findings.push({
      message: `Task ${taskId} is listed in both Active Tasks and Done.`,
      severity: "error",
    });
  } else if (status === "Done" && !progress.inDone) {
    findings.push({
      message: `Task ${taskId} is Done but is not listed in PROGRESS.md Done.`,
      severity: "error",
    });
  } else if (status !== "Done" && !progress.inActive) {
    findings.push({
      message: `Task ${taskId} is ${status} but is not listed in PROGRESS.md Active Tasks.`,
      severity: "warning",
    });
  }

  for (const proposalPath of listAcceptedProposalFiles(root)) {
    const proposal = fs.readFileSync(proposalPath, "utf8");
    const displayProposalPath = toDisplayPath(root, proposalPath);
    if (!proposalReferencesTask(proposal, taskId)) {
      findings.push({
        message: `${displayProposalPath}: accepted proposal does not reference task ${taskId}.`,
        severity: "warning",
      });
    }
  }

  const stagedFiles =
    options.stagedFiles ?? (options.skipGit ? null : getStagedFiles(root));
  if (stagedFiles && !stagedFilesLookRelevant(stagedFiles, taskId)) {
    findings.push({
      message: `Staged files include paths outside the standard closeout scope for task ${taskId}. Inspect before committing.`,
      severity: "warning",
    });
  }

  return {
    findings,
    stagedFiles,
    status,
    taskFile,
  };
}

function parseArgs(argv) {
  const parsed = {
    root: repositoryRoot,
    taskId: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--task") {
      parsed.taskId = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (argument === "--root") {
      parsed.root = path.resolve(argv[index + 1] ?? ".");
      index += 1;
      continue;
    }

    if (!parsed.taskId && /^\d{4}$/.test(argument)) {
      parsed.taskId = argument;
    }
  }

  return parsed;
}

function runCli() {
  const { root, taskId } = parseArgs(process.argv.slice(2));

  if (!taskId) {
    console.error("Usage: node scripts/check-task-closeout.mjs --task <ID>");
    process.exitCode = 1;
    return;
  }

  const result = validateTaskCloseout(root, taskId);
  const errors = result.findings.filter((finding) => finding.severity === "error");
  const warnings = result.findings.filter(
    (finding) => finding.severity === "warning",
  );

  for (const finding of result.findings) {
    const label = finding.severity === "error" ? "ERROR" : "WARN";
    console.error(`${label}: ${finding.message}`);
  }

  if (errors.length === 0) {
    console.log(
      `Task closeout check passed for ${taskId}${
        warnings.length > 0 ? ` with ${warnings.length} warning(s)` : ""
      }.`,
    );
  }

  process.exitCode = errors.length > 0 ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
