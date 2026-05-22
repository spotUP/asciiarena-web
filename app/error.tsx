"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-red)",
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
        [ERROR]
      </div>
      <div style={{ color: "var(--color-red)", marginBottom: "8px" }}>
        {error.message || "Something went wrong."}
      </div>
      {error.digest && (
        <div style={{ color: "#555", marginBottom: "16px", fontSize: "1rem" }}>
          digest: {error.digest}
        </div>
      )}
      <div style={{ marginTop: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
        <button
          onClick={reset}
          style={{
            background: "none",
            border: "1px solid #ff55ff",
            color: "var(--color-magenta)",
            fontFamily: "TopazPlus_a1200, monospace",
            padding: "6px 16px",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          TRY AGAIN
        </button>
        <a href="/" style={{ color: "var(--color-cyan)", textDecoration: "none" }}>
          go home
        </a>
      </div>
    </div>
  );
}
