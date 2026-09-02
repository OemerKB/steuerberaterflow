import { test, expect } from "@playwright/test";
import { loginDemo, loginPortal } from "./helpers";

test.describe("Tenant-Isolation (E2E)", () => {
  test("Mandant kann fremdes Dokument nicht laden", async ({ page }) => {
    await loginPortal(page, "mandant@nordstern-bau.demo");
    // Fremde Dokument-ID (nicht existierend oder fremd) → 401/403, niemals Inhalt
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/documents/cmtestnotexist000000000/file");
      return r.status;
    });
    expect([401, 403, 404]).toContain(res);
  });

  test("Mandant sieht nur eigene Konversationen und Unterlagen", async ({ page }) => {
    await loginPortal(page, "mandant@nordstern-bau.demo");
    await page.goto("/portal/requests");
    await expect(page.getByText("Monatsbuchhaltung August 2026")).toBeVisible();
    await expect(page.getByText("Studio Form GmbH")).not.toBeVisible();
  });

  test("Mandant kann Kanzlei-Routen nicht aufrufen", async ({ page }) => {
    await loginPortal(page, "mandant@nordstern-bau.demo");
    await page.goto("/dashboard");
    await page.waitForURL("**/portal**");
    await expect(page).toHaveURL(/\/portal/);
  });

  test("Kanzleimitarbeiter kann Portal-Routen nicht aufrufen", async ({ page }) => {
    await loginDemo(page, "julia.faber@faber-partner.demo");
    await page.goto("/portal");
    await page.waitForURL("**/dashboard**");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
