import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const rootDirectory = fileURLToPath(new URL("../", import.meta.url));
const apiDirectory = fileURLToPath(new URL("../apps/api/", import.meta.url));
const webDirectory = fileURLToPath(new URL("../apps/web/", import.meta.url));
const playwrightCli = fileURLToPath(
  new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
);

function readPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const startupTimeoutMs = readPositiveIntegerEnv("QCG_E2E_STARTUP_TIMEOUT_MS", 120_000);
const shutdownTimeoutMs = 5_000;
const pollIntervalMs = 500;
const readinessRequestTimeoutMs = 3_000;

const children = [];

async function fetchReadiness(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), readinessRequestTimeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    await response.arrayBuffer();
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function killProcessTree(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    await Promise.race([
      new Promise((resolve) => killer.once("close", resolve)),
      delay(shutdownTimeoutMs),
    ]);
    killer.kill();
    return;
  }

  child.kill("SIGTERM");
}

function startProcess(name, args, options) {
  const child = spawn(process.execPath, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const logs = [];
  const remember = (chunk) => {
    logs.push(...String(chunk).split(/\r?\n/).filter(Boolean));
    if (logs.length > 80) {
      logs.splice(0, logs.length - 80);
    }
  };

  child.stdout.on("data", remember);
  child.stderr.on("data", remember);
  child.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      logs.push(`${name} exited with code ${code}.`);
    }
    if (signal) {
      logs.push(`${name} exited with signal ${signal}.`);
    }
  });

  const record = { child, logs, name };
  children.push(record);
  return record;
}

async function waitForUrl(name, url, expectedStatuses = [200]) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < startupTimeoutMs) {
    try {
      const response = await fetchReadiness(url);
      const isExpectedStatus = expectedStatuses.includes(response.status);
      if (isExpectedStatus) {
        return;
      }
      lastError = new Error(`${url} returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await delay(pollIntervalMs);
  }

  throw new Error(
    `${name} did not become ready at ${url}. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

async function waitForProcessClose(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  await Promise.race([
    new Promise((resolve) => child.once("close", resolve)),
    delay(shutdownTimeoutMs),
  ]);
}

async function stopProcess(record) {
  if (record.external) {
    return;
  }

  if (record.child.exitCode !== null || record.child.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    await killProcessTree(record.child);
    await waitForProcessClose(record.child);
    record.child.stdout?.destroy();
    record.child.stderr?.destroy();
    return;
  }

  await killProcessTree(record.child);
  await waitForProcessClose(record.child);
  record.child.stdout?.destroy();
  record.child.stderr?.destroy();
}

async function stopAll() {
  for (const record of [...children].reverse()) {
    await stopProcess(record);
  }
}

async function flushStream(stream) {
  if (stream.destroyed) {
    return;
  }

  await Promise.race([
    new Promise((resolve) => stream.write("", resolve)),
    delay(1_000),
  ]);
}

async function exitAfterCleanup(code) {
  await Promise.race([stopAll(), delay(shutdownTimeoutMs * children.length + 1_000)]);
  await flushStream(process.stdout);
  await flushStream(process.stderr);
  process.exit(code);
}

function printLogs(record) {
  if (record.external) {
    return;
  }

  if (record.logs.length === 0) {
    return;
  }

  console.error(`\n${record.name} recent output:`);
  for (const line of record.logs) {
    console.error(line);
  }
}

async function isUrlReady(url) {
  try {
    return (await fetchReadiness(url)).ok;
  } catch {
    return false;
  }
}

async function startOrReuse(name, url, args, options) {
  if (await isUrlReady(url)) {
    const record = { external: true, name };
    children.push(record);
    return record;
  }

  const record = startProcess(name, args, options);
  await waitForUrl(name, url);
  return record;
}

function parsePlaywrightSummary(output) {
  const text = output.replace(/\u001b\[[0-9;]*m/g, "");

  if (/\d+\s+(failed|timed out|interrupted)\b/i.test(text)) {
    return 1;
  }

  if (/\d+\s+passed\s+\(/i.test(text)) {
    return 0;
  }

  return null;
}

async function runPlaywright(playwrightArgs) {
  const playwright = spawn(
    process.execPath,
    [playwrightCli, "test", ...playwrightArgs],
    {
      cwd: rootDirectory,
      env: {
        ...process.env,
        QCG_PLAYWRIGHT_MANAGED_SERVERS: "0",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  const outputChunks = [];
  let lastOutputAt = Date.now();
  let inferredExitCode = null;

  const rememberOutput = (stream, chunk) => {
    const text = String(chunk);
    stream.write(text);
    outputChunks.push(text);
    if (outputChunks.length > 120) {
      outputChunks.splice(0, outputChunks.length - 120);
    }
    lastOutputAt = Date.now();
    inferredExitCode = parsePlaywrightSummary(outputChunks.join(""));
  };

  playwright.stdout.on("data", (chunk) => rememberOutput(process.stdout, chunk));
  playwright.stderr.on("data", (chunk) => rememberOutput(process.stderr, chunk));

  return await new Promise((resolve) => {
    let resolved = false;
    let idleCheck;
    const finish = async (code, shouldKill = false) => {
      if (resolved) {
        return;
      }
      resolved = true;
      clearInterval(idleCheck);
      if (shouldKill) {
        await killProcessTree(playwright);
      }
      await waitForProcessClose(playwright);
      playwright.stdout.destroy();
      playwright.stderr.destroy();
      resolve(code);
    };

    idleCheck = setInterval(() => {
      const idleForMs = Date.now() - lastOutputAt;
      if (inferredExitCode === null && idleForMs < 30_000) {
        return;
      }

      void finish(inferredExitCode ?? 1, true);
    }, 500);

    playwright.on("exit", (code, signal) => {
      if (signal) {
        void finish(inferredExitCode ?? 1);
        return;
      }

      void finish(code ?? inferredExitCode ?? 1);
    });
  });
}

async function run() {
  await startOrReuse(
    "API",
    "http://127.0.0.1:3000/health",
    ["node_modules/@nestjs/cli/bin/nest.js", "start"],
    {
      cwd: apiDirectory,
      env: process.env,
    },
  );

  await startOrReuse(
    "Web",
    "http://127.0.0.1:4173/en/comics",
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4173"],
    {
      cwd: webDirectory,
      env: {
        ...process.env,
        VITE_API_PROXY_TARGET: "http://127.0.0.1:3000",
      },
    },
  );
  await waitForUrl("Web", "http://127.0.0.1:4173/en/comics");
  await waitForUrl(
    "Web API proxy",
    "http://127.0.0.1:4173/api/v1/comics?page=1&pageSize=6&locale=en",
  );

  const playwrightArgs = process.argv.slice(2).filter((argument) => argument !== "--");
  const hasReporterOverride = playwrightArgs.some(
    (argument) => argument === "--reporter" || argument.startsWith("--reporter="),
  );
  const reporterArgs = hasReporterOverride ? [] : ["--reporter=list"];

  const exitCode = await runPlaywright([...playwrightArgs, ...reporterArgs]);

  process.exitCode = exitCode;
}

process.on("SIGINT", () => {
  void stopAll().finally(() => process.exit(130));
});
process.on("SIGTERM", () => {
  void stopAll().finally(() => process.exit(143));
});

let finalExitCode = 0;

try {
  await run();
  finalExitCode = process.exitCode ?? 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  for (const record of children) {
    printLogs(record);
  }
  finalExitCode = 1;
} finally {
  await exitAfterCleanup(finalExitCode);
}
