import { MeetingRoom } from "@/app/(app)/appointments/[id]/meeting-room";

export const metadata = { title: "Meetingraum" };

/** Eigenständige Meetingraum-URL (für zukünftige Provider-Integration / Gäste-Links). */
export default function MeetingPage({ params }) {
  const { id } = params;
  return (
    <main id="main" className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-lg font-semibold mb-1">Meetingraum</h1>
        <p className="text-sm text-muted mb-4">Raum {id} · Demo-Modus (kein Video-Provider konfiguriert)</p>
        <MeetingRoom roomName={id} isDemo userName="Teilnehmer" />
      </div>
    </main>
  );
}
