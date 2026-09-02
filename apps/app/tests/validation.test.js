import { describe, it, expect } from "vitest";
import { loginSchema, inviteAcceptSchema, clientBaseSchema, documentMetadataSchema, taskSchema, deadlineSchema, approvalDecisionSchema } from "@steuerberaterflow/validation";

describe("Login-Schema", () => {
  it("gültige Daten", () => {
    const r = loginSchema.safeParse({ email: "julia@faber-partner.demo", password: "demo1234!" });
    expect(r.success).toBe(true);
  });
  it("ungültige E-Mail", () => {
    expect(loginSchema.safeParse({ email: "keine-email", password: "x" }).success).toBe(false);
  });
});

describe("Einladungs-Schema", () => {
  it("Passwörter müssen übereinstimmen", () => {
    const r = inviteAcceptSchema.safeParse({ name: "Max Muster", password: "langes-passwort-1", passwordConfirm: "anderes-passwort-2" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toContain("passwordConfirm");
    }
  });
  it("zu kurzes Passwort wird abgelehnt", () => {
    expect(inviteAcceptSchema.safeParse({ name: "Max Muster", password: "kurz", passwordConfirm: "kurz" }).success).toBe(false);
  });
});

describe("Mandanten-Schema", () => {
  it("gültiger Mandant", () => {
    const r = clientBaseSchema.safeParse({ type: "GMBH", name: "Nordstern Bau GmbH" });
    expect(r.success).toBe(true);
    expect(r.data.status).toBe("ACTIVE");
  });
  it("zu kurzer Name", () => {
    expect(clientBaseSchema.safeParse({ type: "GMBH", name: "N" }).success).toBe(false);
  });
  it("ungültige Rechtsform", () => {
    expect(clientBaseSchema.safeParse({ type: "UNBEKANNT", name: "Test GmbH" }).success).toBe(false);
  });
});

describe("Dokument-Schema", () => {
  it("gültige Metadaten mit Jahr/Monat", () => {
    const r = documentMetadataSchema.safeParse({ category: "INVOICE_IN", title: "Eingangsrechnung", taxYear: 2026, month: 8 });
    expect(r.success).toBe(true);
  });
  it("Monat 13 wird abgelehnt", () => {
    expect(documentMetadataSchema.safeParse({ category: "BANK", title: "Kontoauszug", month: 13 }).success).toBe(false);
  });
  it("ungültige Kategorie", () => {
    expect(documentMetadataSchema.safeParse({ category: "GELDSCHEIN", title: "Test" }).success).toBe(false);
  });
});

describe("Aufgaben-Schema", () => {
  it("gültige Aufgabe mit Checkliste", () => {
    const r = taskSchema.safeParse({
      title: "Belege prüfen",
      priority: "HIGH",
      checklist: [{ text: "Rechnung 1" }, { text: "Rechnung 2" }],
    });
    expect(r.success).toBe(true);
  });
  it("ungültiger Status", () => {
    expect(taskSchema.safeParse({ title: "Test", status: "BEZAHLT" }).success).toBe(false);
  });
  it("zu viele Tags", () => {
    expect(taskSchema.safeParse({ title: "Test", tags: Array.from({ length: 12 }, (_, i) => `t${i}`) }).success).toBe(false);
  });
});

describe("Fristen-Schema", () => {
  it("Fälligkeit erforderlich", () => {
    expect(deadlineSchema.safeParse({ title: "UST-VA", dueDate: "" }).success).toBe(false);
  });
  it("Erinnerung max. 90 Tage", () => {
    expect(deadlineSchema.safeParse({ title: "UST-VA", dueDate: "2026-09-15", reminderDays: 120 }).success).toBe(false);
  });
});

describe("Freigabe-Entscheidung", () => {
  it("nur APPROVED/REJECTED/CHANGES erlaubt", () => {
    expect(approvalDecisionSchema.safeParse({ requestId: "cmtjco5ah005906uza6jmo4vw", decision: "MAYBE" }).success).toBe(false);
    expect(approvalDecisionSchema.safeParse({ requestId: "cmtjco5ah005906uza6jmo4vw", decision: "APPROVED", comment: "ok" }).success).toBe(true);
  });
});
