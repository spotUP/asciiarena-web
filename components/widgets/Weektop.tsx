"use client";

import { useScenewall } from "@/lib/useScenewall";
import PrintLines from "@/components/ui/PrintLines";

interface StatItem { name: string; count: number }

function formatBytes(bytes: number): string {
  if (bytes > 10485759) return (bytes / 1024 / 1024).toFixed(0) + " GB";
  if (bytes > 900000)   return (bytes / 1024 / 1024).toFixed(2) + " GB";
  if (bytes > 10239)    return (bytes / 1024).toFixed(0) + " MB";
  if (bytes > 900)      return (bytes / 1024).toFixed(2) + " MB";
  return bytes + " KB";
}

// Module-level so the hook's effect dependency stays referentially stable.
function parseStats(data: unknown): StatItem[] | null {
  const stats = (data as { stats?: unknown })?.stats;
  return Array.isArray(stats) ? (stats as StatItem[]) : null;
}

// The upstream always returns 5 entries (Count=5 in lib/scenewall.ts).
const EXPECTED_LINES = 5;

export default function Weektop() {
  const items = useScenewall("weektop", parseStats);

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2" style={{ paddingTop: "16px" }}>
      <div className="header col-lg-12 p-0 bg">
        <h2 className="ap-1 bg-header">WEEKTOP - BBS UPLOADERS</h2>
      </div>
      <div className="container-fluid p-0 pl-lg-2 pr-lg-2 bg-secondary">
        <div className="row m-0 px-0 bg-secondary apb-1" style={{ paddingTop: "16px" }}>
          <PrintLines reserveLines={EXPECTED_LINES}>
            {items?.map((item, i) => (
              <div key={i} className="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">
                <span className="yellow text-truncate">{item.name}</span>
                <span className="text-truncate">{formatBytes(item.count)}</span>
              </div>
            ))}
          </PrintLines>
        </div>
      </div>
    </div>
  );
}
