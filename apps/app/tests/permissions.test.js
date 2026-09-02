import { describe, it, expect } from "vitest";
import { can, assertPermission, belongsToOrg, PERMISSIONS } from "../src/lib/permissions";

describe("Berechtigungsmatrix", () => {
  it("OWNER hat alle Kanzlei-Berechtigungen", () => {
    expect(can("OWNER", "clients.create")).toBe(true);
    expect(can("OWNER", "team.manage")).toBe(true);
    expect(can("OWNER", "settings.manage")).toBe(true);
    expect(can("OWNER", "approvals.request")).toBe(true);
  });

  it("STAFF hat operative Rechte, aber keine Team-/Einstellungsrechte", () => {
    expect(can("STAFF", "documents.update")).toBe(true);
    expect(can("STAFF", "deadlines.manage")).toBe(true);
    expect(can("STAFF", "team.manage")).toBe(false);
    expect(can("STAFF", "settings.manage")).toBe(false);
  });

  it("ACCOUNTANT (extern) ist eingeschränkt", () => {
    expect(can("ACCOUNTANT", "documents.create")).toBe(true);
    expect(can("ACCOUNTANT", "tasks.update")).toBe(true);
    expect(can("ACCOUNTANT", "approvals.request")).toBe(false);
    expect(can("ACCOUNTANT", "audit.view")).toBe(false);
    expect(can("ACCOUNTANT", "clients.create")).toBe(false);
  });

  it("CLIENT hat nur Portal-Rechte", () => {
    expect(can("CLIENT", "portal.documents.upload")).toBe(true);
    expect(can("CLIENT", "portal.approvals.decide")).toBe(true);
    expect(can("CLIENT", "clients.read")).toBe(false);
    expect(can("CLIENT", "documents.status")).toBe(false);
    expect(can("CLIENT", "team.manage")).toBe(false);
  });

  it("unbekannte Berechtigungen verweigern Zugriff", () => {
    expect(can("OWNER", "nonexistent.permission")).toBe(false);
  });

  it("assertPermission wirft bei Fehlen mit FORBIDDEN", () => {
    expect(() => assertPermission("CLIENT", "clients.create")).toThrowError(/Keine Berechtigung/);
    try {
      assertPermission("CLIENT", "clients.create");
    } catch (err) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("jede definierte Berechtigung hat mindestens eine Rolle", () => {
    for (const [key, roles] of Object.entries(PERMISSIONS)) {
      expect(Array.isArray(roles), key).toBe(true);
      expect(roles.length, key).toBeGreaterThan(0);
    }
  });
});
