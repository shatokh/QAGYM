#!/usr/bin/env node

import {
  findRepositoryRoot,
  markRunReady,
  prepareRun,
  purgeState,
  recoverRuns,
  validateLedger,
} from "./session-advisor-core.mjs";

function parseArguments(values) {
  const [command, ...rest] = values;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith("--")) {
      throw new Error(`Unexpected argument: ${value}`);
    }
    const key = value.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return { command, options };
}

function requireOption(options, name) {
  const value = options[name];
  if (!value || value === true) {
    throw new Error(`Missing required option --${name}`);
  }
  return value;
}

function proposalIds(options) {
  if (!options.proposals || options.proposals === true) {
    return [];
  }
  return String(options.proposals)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2));
  const repositoryRoot = findRepositoryRoot(options.cwd || process.cwd());
  let result;

  switch (command) {
    case "prepare":
      result = await prepareRun(
        repositoryRoot,
        requireOption(options, "session"),
        requireOption(options, "turn"),
      );
      break;
    case "ready":
      result = await markRunReady(
        repositoryRoot,
        requireOption(options, "session"),
        requireOption(options, "turn"),
        proposalIds(options),
      );
      break;
    case "recover":
      result = await recoverRuns(
        repositoryRoot,
        requireOption(options, "session"),
      );
      break;
    case "validate":
      result = await validateLedger(
        repositoryRoot,
        requireOption(options, "session"),
      );
      break;
    case "purge":
      if (!options.all && !options.session) {
        throw new Error("Purge requires --session <id> or --all");
      }
      if (options.all && options.session) {
        throw new Error("Use either --session <id> or --all, not both");
      }
      if (options.session === true) {
        throw new Error("Option --session requires a value");
      }
      result = await purgeState(
        repositoryRoot,
        options.all ? null : options.session,
      );
      result = { purged: result };
      break;
    default:
      throw new Error(
        "Usage: session-advisor-state.mjs <prepare|ready|recover|validate|purge> [options]; purge requires --session <id> or --all",
      );
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`Session Artifact Advisor: ${error.message}\n`);
  process.exitCode = 1;
});
