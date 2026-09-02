import { test, expect } from "@playwright/test";

test("Produktion: Kanzlei-Login und Dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "julia.faber@faber-partner.demo");
  await page.fill("#password", "demo1234!");
  await page.locator("form").first().getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
  await expect(page.getByText("Aktive Mandanten")).toBeVisible();
  await expect(page.getByText("Fehlende Unterlagen").first()).toBeVisible();
});

test("Produktion: Mandantenportal-Login", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "mandant@nordstern-bau.demo");
  await page.fill("#password", "demo1234!");
  await page.locator("form").first().getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL("**/portal**", { timeout: 30_000 });
  await expect(page.getByText("Das ist jetzt zu erledigen")).toBeVisible();
});
