"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#ff5555",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "TopazPlus_a1200, monospace",
      padding: "32px",
      textAlign: "center",
    }}>
      <div style={{ color: "#ff5555", marginBottom: "16px" }}>
        [ERROR] Something went wrong.
      </div>
      {error.digest && (
        <div style={{ color: "#555", marginBottom: "16px" }}>
          {error.digest}
        </div>
      )}
      <div style={{ display: "flex", gap: "16px" }}>
        <button
          onClick={reset}
          style={{
            background: "none",
            border: "1px solid #555",
            color: "#aaa",
            fontFamily: "inherit",
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a href="/" style={{ color: "#55ffff", textDecoration: "none" }}>
          Go home
        </a>
      </div>
    </div>
  );
}
