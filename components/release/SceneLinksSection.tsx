import Link from "next/link";
import type { SceneLink } from "@/lib/sceneGraph";

// "Appears with" — co-signature links from the scene graph. Renders nothing when
// there are no connections, so it's safe to drop on any entity page.
export default function SceneLinksSection({ links, title, color = "green" }: {
  links: SceneLink[];
  title: string;
  color?: string;
}) {
  if (!links.length) return null;
  return (
    <>
      <div className="header col-lg-12 p-0 amb-1 apt-1">
        <h2 className="ap-1 bg-header">{title}</h2>
      </div>
      <div className="container-fluid bg-secondary apb-1 ap-1 amb-2">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {links.map((l) => (
            <Link key={l.id} href={l.url} className={color} style={{ display: "inline-flex", gap: "6px", alignItems: "center", background: "#222", padding: "2px 8px" }}>
              {l.name}
              <span className="lightgrey" style={{ fontSize: "0.8em" }}>{l.shared}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
