import { describe, it, expect } from "vitest";
import { belongsToOrg } from "../src/lib/permissions";
import { validateUpload, extensionOf, isPreviewable, canTransitionTask, isTaskOverdue, isDeadlineOverdue, nextRecurrenceDate, requestProgress, clientProcessStatus } from "../src/lib/workflow";
import { FILE_UPLOAD } from "@steuerberaterflow/config";
import { hashPassword, verifyPassword, generateSessionToken, hashToken } from "../src/lib/crypto";

describe("Tenant-Isolation (Defense-in-Depth)", () => {
  it("Entität derselben Organisation wird akzeptiert", () => {
    const entity = { organizationId: "org-1" };
    expect(belongsToOrg(entity, "org-1")).toBe(true);
  });

  it("Entität einer anderen Organisation wird verweigert", () => {
    const entity = { organizationId: "org-2" };
    expect(belongsToOrg(entity, "org-1")).toBe(false);
  });

  it("null/undefinierte Entität wird verweigert", () => {
    expect(belongsToOrg(null, "org-1")).toBe(false);
    expect(belongsToOrg(undefined, "org-1")).toBe(false);
  });
});

describe("Dokumentenvalidierung", () => {
  const base = { maxBytes: FILE_UPLOAD.maxBytes, allowedMimeTypes: FILE_UPLOAD.allowedMimeTypes, allowedExtensions: FILE_UPLOAD.allowedExtensions };

  it("gültiges PDF wird akzeptiert", () => {
    const r = validateUpload({ fileName: "rechnung.pdf", mimeType: "application/pdf", sizeBytes: 1000, ...base });
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("unerlaubter Dateityp wird abgelehnt", () => {
    const r = validateUpload({ fileName: "skript.exe", mimeType: "application/x-msdownload", sizeBytes: 1000, ...base });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/nicht erlaubt/);
  });

  it("zu große Datei wird abgelehnt", () => {
    const r = validateUpload({ fileName: "gross.pdf", mimeType: "application/pdf", sizeBytes: 11 * 1024 * 1024, ...base });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/zu groß/);
  });

  it("leere Datei wird abgelehnt", () => {
    const r = validateUpload({ fileName: "leer.pdf", mimeType: "application/pdf", sizeBytes: 0, ...base });
    expect(r.ok).toBe(false);
  });

  it("MIME/Extension-Mismatch wird erkannt (Tarnung)", () => {
    const r = validateUpload({ fileName: "bild.jpg", mimeType: "application/pdf", sizeBytes: 100, ...base });
    expect(r.ok).toBe(false);
  });

  it("extensionOf extrahiert Dateiendungen", () => {
    expect(extensionOf("a.B.PDF")).toBe(".pdf");
    expect(extensionOf("ohne")).toBe("");
  });

  it("Preview-Formate korrekt", () => {
    expect(isPreviewable("application/pdf")).toBe(true);
    expect(isPreviewable("image/png")).toBe(true);
    expect(isPreviewable("application/zip")).toBe(false);
  });
});

describe("Aufgabenstatus-Übergänge", () => {
  it("zulässige Übergänge", () => {
    expect(canTransitionTask("OPEN", "IN_PROGRESS")).toBe(true);
    expect(canTransitionTask("OPEN", "WAITING_CLIENT")).toBe(true);
    expect(canTransitionTask("DONE", "ARCHIVED")).toBe(true);
    expect(canTransitionTask("ARCHIVED", "OPEN")).toBe(true);
  });

  it("unzulässige Übergänge", () => {
    expect(canTransitionTask("DONE", "IN_PROGRESS")).toBe(false);
    expect(canTransitionTask("ARCHIVED", "DONE")).toBe(false);
  });

  it("Überfälligkeitsprüfung respektiert DONE", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 864e5);
    expect(isTaskOverdue({ dueDate: past, status: "OPEN" }, now)).toBe(true);
    expect(isTaskOverdue({ dueDate: past, status: "DONE" }, now)).toBe(false);
    expect(isTaskOverdue({ dueDate: null, status: "OPEN" }, now)).toBe(false);
  });
});

describe("Fristen", () => {
  it("Überfälligkeit", () => {
    const now = new Date();
    expect(isDeadlineOverdue({ dueDate: new Date(now.getTime() - 864e5), status: "PLANNED" }, now)).toBe(true);
    expect(isDeadlineOverdue({ dueDate: new Date(now.getTime() - 864e5), status: "DONE" }, now)).toBe(false);
  });

  it("Wiederholung rechnerisch korrekt", () => {
    const due = new Date("2026-08-10T12:00:00Z");
    expect(nextRecurrenceDate(due, "MONTHLY")?.getUTCMonth()).toBe(8); // September
    expect(nextRecurrenceDate(due, "QUARTERLY")?.getUTCMonth()).toBe(10); // November
    expect(nextRecurrenceDate(due, "YEARLY")?.getUTCFullYear()).toBe(2027);
    expect(nextRecurrenceDate(due, "NONE")).toBeNull();
  });
});

describe("Fehlende Unterlagen – Fortschritt", () => {
  it("zählt fehlende und gelieferte Items", () => {
    const r = requestProgress({
      items: [
        { status: "MISSING" },
        { status: "UPLOADED" },
        { status: "ACCEPTED" },
        { status: "MISSING" },
        { status: "WAIVED" },
      ],
    });
    expect(r.total).toBe(5);
    expect(r.provided).toBe(2); // UPLOADED + ACCEPTED
    expect(r.missing).toBe(3);
    expect(r.percent).toBe(40);
  });

  it("leeres Paket gilt als vollständig", () => {
    expect(requestProgress({ items: [] }).percent).toBe(100);
  });
});

describe("Bearbeitungsstatus Mandantenakte", () => {
  it("Freigabe hat höchste Priorität", () => {
    expect(clientProcessStatus({ missingItems: 3, openQuestions: 2, pendingApprovals: 1 })).toBe("WAITING_APPROVAL");
  });

  it("Rückfrage vor fehlenden Unterlagen", () => {
    expect(clientProcessStatus({ missingItems: 3, openQuestions: 1, pendingApprovals: 0 })).toBe("OPEN_QUESTION");
  });

  it("fehlende Unterlagen", () => {
    expect(clientProcessStatus({ missingItems: 2, openQuestions: 0, pendingApprovals: 0 })).toBe("MISSING_DOCS");
  });

  it("in Bearbeitung", () => {
    expect(clientProcessStatus({ missingItems: 0, openQuestions: 0, pendingApprovals: 0, openTasks: 2 })).toBe("IN_PROGRESS");
  });

  it("vollständig", () => {
    expect(clientProcessStatus({})).toBe("COMPLETE");
  });
});

describe("Passwort-Hashing & Sessions", () => {
  it("Hash ist verifizierbar und saliniert", () => {
    const h1 = hashPassword("demo1234!");
    const h2 = hashPassword("demo1234!");
    expect(h1).not.toBe(h2);
    expect(verifyPassword("demo1234!", h1)).toBe(true);
    expect(verifyPassword("falsch", h1)).toBe(false);
  });

  it("Session-Token/Hash-Paar ist konsistent", () => {
    const { token, tokenHash } = generateSessionToken();
    expect(hashToken(token)).toBe(tokenHash);
    expect(token).not.toContain("=");
  });
});
