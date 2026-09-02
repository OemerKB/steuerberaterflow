import "server-only";

/**
 * Storage-Adapter.
 * MVP-Treiber "db": Dokumente liegen als Bytes in PostgreSQL (DocumentVersion.data).
 * Vorteil: geschützte Downloads funktionieren ohne öffentlichen Bucket, ACL läuft
 * vollständig über die App. Für große Volumina ist ein Supabase-S3-Treiber
 * vorbereitet (siehe docs/integrations.md) und via STORAGE_DRIVER=supabase schaltbar.
 */

export const storageDriver = process.env.STORAGE_DRIVER || "db";

export const storage = {
  async put({ buffer, documentId, version }) {
    if (storageDriver === "supabase") {
      // Vorbereiteter Treiber: Upload in Supabase Storage-Bucket "documents".
      // Wird erst aktiv, wenn SUPABASE_URL + SERVICE_ROLE_KEY konfiguriert sind.
      throw new Error("Supabase-Storage-Treiber ist in dieser Version nicht aktiv – bitte STORAGE_DRIVER=db verwenden.");
    }
    return { driver: "db", data: buffer, key: `doc-${documentId}-v${version}` };
  },

  async get({ documentId, version }) {
    // Im db-Treiber liefert der Aufrufer die Bytes direkt aus der DB.
    return { driver: "db" };
  },
};
