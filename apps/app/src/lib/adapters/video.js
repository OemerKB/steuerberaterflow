import "server-only";

/**
 * Video-Meeting-Adapter.
 * Ohne konfigurierten Provider (DAILY_API_KEY) wird ein klar gekennzeichneter
 * Demo-Meetingraum angeboten: Steuerung von Kamera, Mikrofon und Bildschirmfreigabe
 * wird lokal simuliert (getUserMedia wird nicht aufgerufen, keine behauptete Verbindung).
 */

export const videoConfigured = Boolean(process.env.DAILY_API_KEY);

export const videoProvider = videoConfigured ? "daily" : "demo";

export async function createMeetingRoom({ organizationId, title, expiresAt }) {
  if (videoConfigured) {
    // Vorbereitete Integration: Daily-Room über REST API anlegen.
    // Erst bei Konfiguration aktiv – siehe docs/integrations.md.
    try {
      const res = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: { exp: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined },
        }),
      });
      if (res.ok) {
        const room = await res.json();
        return { provider: "daily", externalId: room.id, url: room.url, isDemo: false };
      }
    } catch (err) {
      console.error("[video] Daily-Fehler, nutze Demo-Raum:", err.message);
    }
  }
  const roomId = `demo-${organizationId}-${Date.now().toString(36)}`;
  return {
    provider: "demo",
    externalId: roomId,
    url: `/meeting/${roomId}`,
    isDemo: true,
  };
}
