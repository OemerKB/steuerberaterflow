import { test, expect } from "@playwright/test";
import { loginDemo, logout, loginPortal } from "./helpers";

test.describe("Zentraler Mandanten-Dokumenten-Flow", () => {
  test("Kanzlei legt Mandanten an, Mandant lädt hoch, Kanzlei prüft und fordert Freigabe, Mandant bestätigt", async ({ browser }) => {
    const firmCtx = await browser.newContext();
    const firm = await firmCtx.newPage();

    // 1. Kanzlei meldet sich an
    await loginDemo(firm, "julia.faber@faber-partner.demo");
    await firm.goto("/clients");

    // 2. Kanzlei legt Mandanten an (Onboarding-Wizard, kurzer Pfad)
    await firm.getByRole("link", { name: "+ Neuer Mandant" }).click();
    await firm.waitForLoadState("networkidle");
    await firm.getByRole("button", { name: "Freiberufler" }).click();
    await expect(firm.getByRole("heading", { name: "Stammdaten erfassen" })).toBeVisible();
    await firm.fill("#ob-name", "E2E Test Mandant");
    await firm.getByRole("button", { name: /Weiter/ }).click();
    await expect(firm.getByRole("heading", { name: "Rechtsform bestimmen" })).toBeVisible();
    await firm.getByRole("button", { name: /Weiter/ }).click();
    await expect(firm.getByRole("heading", { name: "Ansprechpartner hinzufügen" })).toBeVisible();
    await firm.fill("#ob-contact-name", "Erika Muster");
    await firm.fill("#ob-contact-email", "e2e-mandant@nordstern-bau.demo");
    await firm.getByRole("button", { name: /Weiter/ }).click();
    await expect(firm.getByRole("heading", { name: "Steuerarten auswählen" })).toBeVisible();
    await firm.getByRole("button", { name: /Weiter/ }).click();
    await expect(firm.getByRole("heading", { name: "Benötigte Unterlagen festlegen" })).toBeVisible();
    await firm.getByRole("button", { name: /Weiter/ }).click();
    await expect(firm.getByRole("heading", { name: "Zuständigkeit & Einladung" })).toBeVisible();
    await firm.getByRole("button", { name: "Mandant anlegen" }).click();
    await firm.waitForURL("**/clients/**");
    await expect(firm.getByText("E2E Test Mandant")).toBeVisible();
    const clientUrl = firm.url();

    // Unterlagen anfordern
    await firm.getByRole("button", { name: /Unterlagen anfordern/ }).first().click();
    await firm.locator("#req-client").selectOption({ index: 1 });
    await firm.locator("#req-title").fill("E2E Anforderung September");
    // Standard-Unterlagen belassen, erste bleibt: Kontoauszug
    await firm.getByRole("button", { name: "Unterlagen anfordern", exact: true }).click();
    await expect(firm.getByText("Unterlagenpaket erstellt.")).toBeVisible({ timeout: 15_000 });

    // 3. Mandant meldet sich an (bestehendes Portal-Konto aus Demo-Daten)
    const clientCtx = await browser.newContext();
    const client = await clientCtx.newPage();
    await loginPortal(client, "mandant@nordstern-bau.demo");
    await client.goto("/portal/requests");

    // 4. Mandant lädt Dokument zur fehlenden Unterlage hoch
    await client.locator('input[type="file"]').first().setInputFiles({
      name: "kontoauszug-e2e.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 E2E Testdokument"),
    });
    await expect(client.getByText("Datei(en) übermittelt")).toBeVisible({ timeout: 20_000 });

    // 5. Kanzlei sieht das Dokument und ändert den Status
    await firm.goto("/documents");
    await firm.getByPlaceholder("Dokument, Mandant, Kategorie…").fill("kontoauszug-e2e");
    await expect(firm.getByText("kontoauszug-e2e").first()).toBeVisible({ timeout: 20_000 });
    await firm.getByText("kontoauszug-e2e").first().click();
    await firm.waitForURL("**/documents/**");
    await firm.getByLabel("Status ändern").selectOption("ACCEPTED");
    await expect(firm.getByText("Status geändert: Akzeptiert")).toBeVisible();

    // 6. Kanzlei stellt Rückfrage per Nachricht
    await firm.getByRole("button", { name: "Rückfrage" }).click();
    await firm.locator("#req-title").fill("Rückfrage zum Kontoauszug");
    await firm.locator("#req-desc").fill("Bitte Vollständigkeit bestätigen.");
    // Es wird ein weiteres Unterlagenpaket angelegt (Demo der Rückfrage-Schleife)
    await firm.getByRole("button", { name: "Unterlagen anfordern", exact: true }).click();
    await expect(firm.getByText("Unterlagenpaket erstellt.")).toBeVisible();

    // 7. Mandant beantwortet per Nachricht
    await client.goto("/portal/messages");
    const newMsgForm = client.locator("form").filter({ has: client.locator('input[name="subject"]') });
    await newMsgForm.locator('input[name="subject"]').fill("Frage zur E2E-Anforderung");
    await newMsgForm.locator("textarea[name=content]").fill("Der Kontoauszug ist vollständig hochgeladen.");
    await newMsgForm.getByRole("button", { name: /Senden/ }).click();
    await client.waitForURL("**/portal/messages?c=**", { timeout: 20_000 });
    await expect(client.getByText("Der Kontoauszug ist vollständig hochgeladen.")).toBeVisible();

    // 8. Kanzlei fordert Freigabe an
    await firm.goto("/approvals");
    await firm.getByRole("button", { name: /Freigabe anfordern/ }).click();
    await firm.locator("#ap-client").selectOption({ label: "Nordstern Bau GmbH" });
    await firm.locator("#ap-title").fill("E2E Freigabe Steuererklärung");
    await firm.locator("#ap-msg").fill("Bitte prüfen und freigeben.");
    await firm.getByRole("button", { name: "Anfordern" }).click();
    await expect(firm.getByText("Freigabeanfrage an Mandant gesendet.")).toBeVisible();

    // 9. Mandant bestätigt das Dokument
    await client.goto("/portal/approvals");
    const approvalCard = client.locator("div.rounded-lg.border", { hasText: "E2E Freigabe Steuererklärung" }).first();
    await approvalCard.getByRole("button", { name: "Freigeben" }).click();
    await expect(approvalCard.getByText("Freigegeben")).toBeVisible({ timeout: 20_000 });

    // Kanzlei sieht die Entscheidung
    await firm.goto("/approvals?status=APPROVED");
    await expect(firm.getByText("E2E Freigabe Steuererklärung").first()).toBeVisible();

    await firmCtx.close();
    await clientCtx.close();
  });
});
