"use client";

import { useEffect } from "react";

export type LogoHeaderProps = {
  logos: string[];
};

export default function LogoHeader({ logos }: LogoHeaderProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window as unknown as { switcharoo?: (...args: unknown[]) => void };
      if (typeof w.switcharoo === "function") {
        w.switcharoo("#logoswitcher > div", 60000);
      }
    }
  }, []);

  return (
    <div className="overflow-hidden d-none d-lg-block mx-auto">
      <div id="logoswitcher">
        {logos.map((logo, i) => (
          <div
            key={i}
            className="logo nolink"
            style={i > 0 ? { display: "none", whiteSpace: "pre" } : { whiteSpace: "pre" }}
          >
            <a href="/" className="logo ascii">
              <pre style={{ overflow: "hidden" }}>
                <span className="magenta">{logo}</span>
              </pre>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
