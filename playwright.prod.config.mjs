import { defineConfig } from "@playwright/test";

/** Smoke-Tests gegen die produktive Deployment-URL (E2E_PROD_URL). */
export default defineConfig({
  testDir: "./e2e-prod",
  timeout: 120_000,
  use: {
    baseURL: process.env.E2E_PROD_URL || "https://steuerberaterflow-live.vercel.app",
    locale: "de-DE",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
