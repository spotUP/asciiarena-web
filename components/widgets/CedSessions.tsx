"use client";
import { useEffect, useState } from "react";
import { urlsafe } from "@/lib/utils";
import type { CedDocument, CedSessionsData } from "@/app/api/ced-sessions/route";
import PrintLines from "@/components/ui/PrintLines";

const SPECTATE_BASE = "https://hippoplayer.se/?spectate=";

// Pulls the initial state from /api/ced-sessions (so the widget shows
// data immediately on first paint) then subscribes to the site:ced-sessions
// SSE channel. The server-side singleton poller in lib/cedPoller.ts polls
// the external feed every 10s for all viewers combined — no per-browser
// polling.
function loadInitial(set: (d: CedDocument[]) => void) {
  fetch("/api/ced-sessions")
    .then(r => r.json())
    .then((d: unknown) => {
      if (d && typeof d === "object" && "documents" in d) {
        set((d as CedSessionsData).documents);
      }
    })
    .catch(() => {});
}

interface CedSessionsEvent {
  type?: string;
  documents?: CedDocument[];
}

export default function CedSessions() {
  const [documents, setDocuments] = useState<CedDocument[]>([]);

  useEffect(() => {
    loadInitial(setDocuments);
    const es = new EventSource(`/api/live?channel=site:ced-sessions`);
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const evt = JSON.parse(e.data) as CedSessionsEvent;
        if (evt.type === "update" && Array.isArray(evt.documents)) {
          setDocuments(evt.documents);
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  if (documents.length === 0) return null;

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">EDITING IN CED</h2>
      </div>
      <div className="container col-12 apt-1 apb-1 m-0 p-0 bg-secondary">
        <PrintLines>
        {documents.map(doc => (
          <div key={doc.id} className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
            <a
              href={SPECTATE_BASE + encodeURIComponent(doc.id)}
              className="text-truncate"
              style={{ color: "#aaaaaa" }}
              title={doc.name}
            >
              {doc.name}
            </a>
            <span className="text-truncate" style={{ paddingLeft: "8px", flexShrink: 0 }}>
              {doc.users.map((u, i) => (
                <span key={u.nick}>
                  {i > 0 && <span style={{ color: "#aaaaaa" }}>, </span>}
                  <a href={`/member/${urlsafe(u.nick)}`} style={{ color: u.color || undefined }}>
                    {u.nick}
                  </a>
                </span>
              ))}
            </span>
          </div>
        ))}
        </PrintLines>
      </div>
    </div>
  );
}
