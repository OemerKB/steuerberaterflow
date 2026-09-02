import { test, expect } from "@playwright/test";

test.describe("Anmeldung", () => {
  test("falsche Zugangsdaten zeigen Fehler", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "julia.faber@faber-partner.demo");
    await page.fill("#password", "falsches-passwort");
    await page.locator('form').first().getByRole('button', { name: 'Anmelden' }).click();
    await expect(page.getByText("E-Mail oder Passwort ist nicht korrekt.")).toBeVisible();
  });

  test("Kanzlei meldet sich per Demo-Konto an und sieht das Dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("demo-login-julia.faber@faber-partner.demo").click();
    await page.waitForURL("**/dashboard**", { timeout: 30_000 });
    await expect(page.getByText("Aktive Mandanten")).toBeVisible();
    await expect(page.getByText("Offene Aufgaben", { exact: true })).toBeVisible();
  });

  test("ungeschützte Route leitet zur Anmeldung", async ({ page }) => {
    await page.goto("/clients");
    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
  });
});
