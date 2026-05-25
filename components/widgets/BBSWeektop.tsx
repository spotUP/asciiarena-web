"use client";

import { useEffect, useState } from "react";

interface StatItem { name: string; count: number }

function formatBytes(bytes: number): string {
  if (bytes > 10485759) return (bytes / 1024 / 1024).toFixed(0) + " GB";
  if (bytes > 900000)   return (bytes / 1024 / 1024).toFixed(2) + " GB";
  if (bytes > 10239)    return (bytes / 1024).toFixed(0) + " MB";
  if (bytes > 900)      return (bytes / 1024).toFixed(2) + " MB";
  return bytes + " KB";
}

const FRAMES = ["...", ".. ", ".  ", ".. "];

function DotsLoader() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % FRAMES.length), 350);
    return () => clearInterval(t);
  }, []);
  return <span className="lightgrey" style={{ fontFamily: "monospace", whiteSpace: "pre" }}>{FRAMES[frame]}</span>;
}

export default function BBSWeektop() {
  const [items, setItems] = useState<StatItem[] | null>(null);

  useEffect(() => {
    fetch("https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=26&Count=5")
      .then(r => r.json())
      .then((data: { stats: StatItem[] }) => setItems(Array.isArray(data?.stats) ? data.stats : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2" style={{ paddingTop: "16px" }}>
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">WEEKTOP - BBS:ES</h2>
      </div>
      <div className="container-fluid p-0 pl-lg-2 pr-lg-2 bg-secondary">
        <div className="row m-0 p-0 bg-secondary apb-1" style={{ paddingTop: "16px" }}>
          {items === null && (
            <div className="col-lg-12 p-0 pl-lg-2 pr-lg-2" style={{ paddingTop: "16px" }}><DotsLoader /></div>
          )}
          {items?.map((item, i) => (
            <div key={i} className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
              <span className="yellow text-truncate">{item.name}</span>
              <span className="text-truncate">{formatBytes(item.count)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
