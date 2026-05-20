"use client";

import { useEffect, useMemo, useState } from "react";

export type LogoHeaderProps = {
  logos: string[];
};

export default function LogoHeader({ logos }: LogoHeaderProps) {
  const shuffled = useMemo(
    () => [...logos].sort(() => Math.random() - 0.5).slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (shuffled.length < 2) return;
    const id = setInterval(() => setCurrent((i) => (i + 1) % shuffled.length), 60000);
    return () => clearInterval(id);
  }, [shuffled.length]);

  return (
    <div className="overflow-hidden d-none d-lg-block mx-auto">
      <div id="logoswitcher">
        {shuffled.map((logo, i) => (
          <div
            key={i}
            className="logo nolink"
            style={i !== current ? { display: "none", whiteSpace: "pre" } : { whiteSpace: "pre" }}
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
