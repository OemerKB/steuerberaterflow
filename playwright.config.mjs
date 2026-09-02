import { defineConfig } from "@playwright/test";

const PORT = process.env.E2E_PORT || 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: "de-DE",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: `npm run start --workspace @sf/app -- -p ${PORT}`,
        url: `http://127.0.0.1:${PORT}/login`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
