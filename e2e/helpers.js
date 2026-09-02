import { expect } from "@playwright/test";

/** Anmeldung über Demo-Kurzanmeldung im Login-Formular (keine Credentials in URLs). */
export async function loginDemo(page, email) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234!");
  await page.locator('form').first().getByRole('button', { name: 'Anmelden' }).click();
  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
}

export async function loginPortal(page, email) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234!");
  await page.locator('form').first().getByRole('button', { name: 'Anmelden' }).click();
  await page.waitForURL("**/portal**", { timeout: 30_000 });
}

export async function logout(page) {
  await page.goto("/dashboard");
  const form = page.locator('form[action="/api/auth/logout"]');
  await form.locator('button:has-text("Abmelden")').click().catch(() => {});
}
