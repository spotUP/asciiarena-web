"use client";
import { useEffect, useState } from "react";
import { urlsafe } from "@/lib/utils";
import type { CedDocument, CedSessionsData } from "@/app/api/ced-sessions/route";

const POLL_MS = 30_000;

function load(set: (d: CedDocument[]) => void) {
  fetch("/api/ced-sessions")
    .then(r => r.json())
    .then((d: unknown) => {
      if (d && typeof d === "object" && "documents" in d) {
        set((d as CedSessionsData).documents);
      }
    })
    .catch(() => {});
}

export default function CedSessions() {
  const [documents, setDocuments] = useState<CedDocument[]>([]);

  useEffect(() => {
    load(setDocuments);
    const interval = setInterval(() => load(setDocuments), POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (documents.length === 0) return null;

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">EDITING IN CED</h2>
      </div>
      <div className="container col-12 p-0 m-0 apt-1 bg-secondary">
        {documents.map(doc => (
          <div key={doc.id} className="col-lg-12" style={{ paddingLeft: "8px", paddingBottom: "4px" }}>
            <div style={{ color: "#aaaaaa", fontSize: "0.85em" }}>{doc.name}</div>
            {doc.users.map(u => (
              <div key={u.nick} style={{ paddingLeft: "8px" }}>
                <a className="yellow" href={`/member/${urlsafe(u.nick)}`} style={{ color: u.color || undefined }}>
                  {u.nick}
                </a>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
