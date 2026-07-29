import ContentLink from "@/components/ui/ContentLink";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-grey)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "TopazPlus_a1200, monospace",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <div style={{ color: "var(--color-magenta)", fontSize: "1rem", marginBottom: "16px" }}>
        404 - NOT FOUND
      </div>
      <div style={{ color: "var(--color-grey)", marginBottom: "24px" }}>
        The page you are looking for does not exist.
      </div>
      <ContentLink href="/collys" style={{ color: "var(--color-cyan)", textDecoration: "none" }}>
        &lt; back to collys
      </ContentLink>
    </div>
  );
}
