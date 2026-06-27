"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BrokenColly {
  id: number;
  filename: string;
  broken_comment?: string | null;
}

export default function BrokenCollysClient() {
  const [broken, setBroken] = useState<BrokenColly[]>([]);

  useEffect(() => {
    fetch("/api/admin/collys?broken=1").then(r => r.json()).then(setBroken).catch(() => {});
  }, []);

  const del = async (id: number) => {
    if (!confirm("Delete this colly permanently? Files will be removed.")) return;
    await fetch("/api/admin/collys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBroken(prev => prev.filter(c => c.id !== id));
  };

  const markFixed = async (id: number) => {
    await fetch("/api/admin/collys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, broken: 0, broken_comment: null }),
    });
    setBroken(prev => prev.filter(c => c.id !== id));
  };

  return (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">
          BROKEN COLLYS{" "}
          {broken.length > 0 && <span className="red">({broken.length})</span>}
        </h2>
      </div>

      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        {broken.length === 0 ? (
          <div className="lightgrey">No broken collys reported.</div>
        ) : (
          <>
            <div className="row lightgrey amb-1" style={{ borderBottom: "1px solid #444" }}>
              <div className="col-4">FILENAME</div>
              <div className="col-4">COMMENT</div>
              <div className="col-4">ACTIONS</div>
            </div>
            {broken.map(c => (
              <div key={c.id} className="row amb-1 align-items-center">
                <div className="col-4 text-truncate">
                  <Link className="magenta" href={`/release/${c.filename}`}>{c.filename}</Link>
                </div>
                <div className="col-4 lightgrey text-truncate">{c.broken_comment ?? ""}</div>
                <div className="col-4" style={{ display: "flex", gap: "8px" }}>
                  <input type="button" className="btn-big" value="Mark Fixed" onClick={() => markFixed(c.id)} />
                  <input type="button" className="btn-big" value="Delete" style={{ color: "#ff5555" }} onClick={() => del(c.id)} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
