import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const apiDirectory = fileURLToPath(new URL("./apps/api/", import.meta.url));
const webDirectory = fileURLToPath(new URL("./apps/web/", import.meta.url));
const isCi = Boolean(process.env.CI);
const useManagedServers = process.env.QCG_PLAYWRIGHT_MANAGED_SERVERS !== "0";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/playwright",
  forbidOnly: isCi,
  fullyParallel: false,
  retries: isCi ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "./playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: useManagedServers
    ? [
        {
          command: "node node_modules/@nestjs/cli/bin/nest.js start",
          cwd: apiDirectory,
          url: "http://127.0.0.1:3000/health",
          reuseExistingServer: !isCi,
          timeout: 120_000,
          gracefulShutdown: { signal: "SIGINT", timeout: 500 },
          stdout: "ignore",
          stderr: "ignore",
        },
        {
          command:
            "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173",
          cwd: webDirectory,
          url: "http://127.0.0.1:4173/en/comics",
          reuseExistingServer: !isCi,
          timeout: 120_000,
          gracefulShutdown: { signal: "SIGINT", timeout: 500 },
          stdout: "ignore",
          stderr: "ignore",
          env: {
            VITE_API_PROXY_TARGET: "http://127.0.0.1:3000",
          },
        },
      ]
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
