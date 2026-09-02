import "server-only";

/**
 * E-Mail-Adapter.
 * Mit RESEND_API_KEY: Versand über Resend REST API (ohne SDK-Abhängigkeit).
 * Ohne Konfiguration:DEV-Fallback – E-Mails werden nur strukturiert geloggt
 * und landen zusätzlich als Benachrichtigung im System.
 */

const apiKey = process.env.RESEND_API_KEY || "";
const from = process.env.EMAIL_FROM || "SteuerberaterFlow <onboarding@resend.dev>";

export const emailConfigured = Boolean(apiKey);

export async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured) {
    console.info("[email:demo] Kein E-Mail-Versand konfiguriert (RESEND_API_KEY fehlt).", {
      to,
      subject,
    });
    return { delivered: false, mode: "demo" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || `<pre style="font-family:inherit">${text || ""}</pre>`,
        text: text || "",
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend-Fehler:", res.status, await res.text().catch(() => ""));
      return { delivered: false, mode: "resend" };
    }
    return { delivered: true, mode: "resend" };
  } catch (err) {
    console.error("[email] Versand fehlgeschlagen:", err.message);
    return { delivered: false, mode: "resend" };
  }
}

export function invitationEmail({ organizationName, inviterName, inviteUrl, role }) {
  return {
    subject: `Einladung zu SteuerberaterFlow – ${organizationName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#176B4D">Einladung zu ${organizationName}</h2>
        <p>${inviterName} hat Sie als <strong>${role}</strong> zu SteuerberaterFlow eingeladen.</p>
        <p style="margin:24px 0">
          <a href="${inviteUrl}" style="background:#176B4D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Einladung annehmen</a>
        </p>
        <p style="color:#667069;font-size:13px">Der Link ist 7 Tage gültig. Falls Sie diese Einladung nicht erwarten, ignorieren Sie diese E-Mail.</p>
      </div>`,
    text: `${inviterName} hat Sie als ${role} zu SteuerberaterFlow eingeladen. Link: ${inviteUrl} (7 Tage gültig)`,
  };
}

export function reminderEmail({ clientName, requestTitle, missingCount, totalCount, dueDate, portalUrl }) {
  return {
    subject: `Fehlende Unterlagen: ${requestTitle}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#176B4D">Fehlende Unterlagen</h2>
        <p>Hallo ${clientName},</p>
        <p>für <strong>${requestTitle}</strong> fehlen noch <strong>${missingCount} von ${totalCount}</strong> Unterlagen${dueDate ? ` (Fälligkeit: ${dueDate})` : ""}.</p>
        <p style="margin:24px 0">
          <a href="${portalUrl}" style="background:#176B4D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Unterlagen hochladen</a>
        </p>
      </div>`,
    text: `Fehlende Unterlagen für ${requestTitle}: ${missingCount} von ${totalCount}. Hochladen: ${portalUrl}`,
  };
}
