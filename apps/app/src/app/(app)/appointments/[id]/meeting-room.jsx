"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX, PhoneOff, Info } from "lucide-react";
import { Badge, Button } from "@steuerberaterflow/ui";

/**
 * Demo-Meetingraum: simuliert Kamera-, Mikrofon- und Bildschirmfreigabe-Steuerung.
 * Es wird KEINE echte Verbindung aufgebaut und kein getUserMedia aufgerufen –
 * die UI bereitet die spätere Integration eines echten Providers (Daily, LiveKit) vor.
 */
export function MeetingRoom({ roomName, isDemo, userName }) {
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  if (isDemo === false) {
    return (
      <div className="text-center py-6">
        <p className="text-sm mb-3">Live-Meetingraum bereit.</p>
        <a href={`/meeting/${roomName}`} className="text-sm sf-link">Meetingraum öffnen</a>
      </div>
    );
  }

  return (
    <div>
      {!joined ? (
        <div className="flex flex-col items-center py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary mb-3">
            <Video className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium">Raum „{roomName}"</p>
          <p className="text-xs text-muted mt-1 mb-4 text-center max-w-sm">
            Demo-Modus: Beitritt simuliert die Teilnahme. Kamera, Mikrofon und Bildschirmfreigabe
            können ausprobiert werden, ohne dass Medien übertragen werden.
          </p>
          <Button onClick={() => setJoined(true)}>Demo-Meeting beitreten</Button>
          <p className="text-[10px] text-muted mt-3 flex items-center gap-1">
            <Info className="h-3 w-3" /> Kein echter Video-Provider konfiguriert
          </p>
        </div>
      ) : (
        <div>
          <div className="relative rounded-lg border border-border bg-foreground/90 aspect-video flex items-center justify-center overflow-hidden">
            {/* Simulierter Bühnenbereich */}
            {camOn ? (
              <div className="flex flex-col items-center text-white/80">
                <div className="h-16 w-16 rounded-full bg-accent/40 flex items-center justify-center mb-2">
                  <Video className="h-7 w-7" />
                </div>
                <p className="text-xs">{userName} (Demo-Kamera)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-white/50">
                <VideoOff className="h-8 w-8 mb-2" />
                <p className="text-xs">Kamera ausgeschaltet</p>
              </div>
            )}

            {screenShare ? (
              <div className="absolute inset-4 rounded-md border-2 border-dashed border-accent/70 bg-background/95 flex flex-col items-center justify-center">
                <MonitorUp className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium">Bildschirmfreigabe (Demo)</p>
                <p className="text-xs text-muted mt-1">Simulierte Freigabe – kein echtes Streaming</p>
              </div>
            ) : null}

            <span className="absolute left-3 top-3">
              <Badge tone={isDemo ? "amber" : "green"}>{isDemo ? "DEMO-RAUM" : "LIVE"}</Badge>
            </span>
            <span className="absolute right-3 top-3">
              <Badge tone="gray">Keine aktive Verbindung</Badge>
            </span>
          </div>

          {/* Steuerleiste */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button
              variant={micOn ? "secondary" : "danger"}
              size="icon"
              aria-label={micOn ? "Mikrofon ausschalten" : "Mikrofon einschalten"}
              onClick={() => setMicOn(!micOn)}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={camOn ? "secondary" : "danger"}
              size="icon"
              aria-label={camOn ? "Kamera ausschalten" : "Kamera einschalten"}
              onClick={() => setCamOn(!camOn)}
            >
              {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={screenShare ? "accent" : "secondary"}
              size="icon"
              aria-label={screenShare ? "Bildschirmfreigabe beenden" : "Bildschirmfreigabe starten"}
              onClick={() => setScreenShare(!screenShare)}
            >
              {screenShare ? <MonitorX className="h-4 w-4" /> : <MonitorUp className="h-4 w-4" />}
            </Button>
            <Button variant="danger" onClick={() => { setJoined(false); setScreenShare(false); }}>
              <PhoneOff className="h-4 w-4" /> Meeting verlassen
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted mt-2">
            Status: Mikrofon {micOn ? "an" : "aus"} · Kamera {camOn ? "an" : "aus"} · Freigabe {screenShare ? "aktiv (Demo)" : "aus"}
          </p>
        </div>
      )}
    </div>
  );
}
