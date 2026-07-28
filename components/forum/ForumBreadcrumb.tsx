import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

// One 16px row: FORUM > General Discussion > Some topic title
// The separator is ">" and never a Unicode arrow (RULES.md ASCII-only UI).
export default function ForumBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div
      className="col-lg-12 p-0"
      style={{ height: "16px", lineHeight: "16px", marginBottom: "16px", overflow: "hidden" }}
    >
      {crumbs.map((c, i) => (
        <span key={i}>
          {i > 0 && <span className="lightgrey">{" > "}</span>}
          {c.href ? (
            <Link prefetch={false} href={c.href} className="magenta">
              {c.label}
            </Link>
          ) : (
            <span className="lightgrey">{c.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
