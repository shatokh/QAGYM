#!/usr/bin/env node

import {
  captureHookEvent,
  findRepositoryRoot,
  isAdvisorTrigger,
  readHookInput,
} from "../../.agents/skills/session-artifact-advisor/scripts/session-advisor-core.mjs";

function hookOutput(input, repositoryRoot) {
  if (
    input.hook_event_name === "UserPromptSubmit" &&
    isAdvisorTrigger(input.prompt)
  ) {
    return {
      continue: true,
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext:
          "Session Artifact Advisor trigger context: " +
          `session_id=${JSON.stringify(input.session_id)}, ` +
          `turn_id=${JSON.stringify(input.turn_id)}, ` +
          `repository_root=${JSON.stringify(repositoryRoot)}. ` +
          "Use these exact values with the advisor state script.",
      },
    };
  }

  if (input.hook_event_name === "Stop") {
    return { continue: true };
  }

  return null;
}

async function main() {
  let input;
  try {
    input = await readHookInput();
    const repositoryRoot = findRepositoryRoot(input.cwd || process.cwd());
    await captureHookEvent(repositoryRoot, input);
    const output = hookOutput(input, repositoryRoot);
    if (output) {
      process.stdout.write(`${JSON.stringify(output)}\n`);
    }
  } catch (error) {
    process.stderr.write(`Session Artifact Advisor hook: ${error.message}\n`);
    if (input?.hook_event_name === "Stop") {
      process.stdout.write('{"continue":true}\n');
    }
    process.exitCode = 0;
  }
}

await main();
