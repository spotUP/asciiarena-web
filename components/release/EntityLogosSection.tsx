import Link from "next/link";
import type { CollyLogoHit } from "@/lib/collyLogoSearch";

// Lists collys that contain a logo resolved to this entity (crew / artist /
// user). Renders nothing when empty, so it's safe to drop on any entity page
// (including before the catalog is populated). Server component.
export default function EntityLogosSection({
  hits,
  title = "Logos in collys",
}: {
  hits: CollyLogoHit[];
  title?: string;
}) {
  if (!hits.length) return null;
  return (
    <>
      <div className="header col-lg-12 p-0 amt-1">
        <h2 className="ap-1 bg-header">{title}</h2>
      </div>
      <div className="container col-12 apt-1 apb-1 m-0 p-0 bg-secondary">
        {hits.map((h) => (
          <div key={h.filename} className="col-lg-12 p-0 pl-lg-2 pr-lg-2">
            <Link className="magenta" href={`/release/${h.filename}#logo-${h.start_line}`}>{h.name ?? h.filename}</Link>
            <span className="lightgrey apl-1">{h.labels.slice(0, 4).join(", ")}</span>
          </div>
        ))}
      </div>
    </>
  );
}
