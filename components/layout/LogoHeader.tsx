"use client";

import { useEffect, useMemo, useState } from "react";

export type LogoHeaderProps = {
  logos: string[];
};

// Smooth ping-pong copper-bar scroller. CSS animations on background-position
// of background-clip:text elements are silently dropped by Chrome's
// compositor, so the loop sets style.backgroundPositionY directly each frame.
function startCopperScroll(): () => void {
  const els = document.querySelectorAll<HTMLElement>(".copper-gradient");
  if (els.length === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }
  const period = 8000; // ms for one direction; full ping-pong = 16s
  // ease-in-out cubic — matches CSS cubic-bezier(0.42, 0, 0.58, 1) feel
  const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const elapsed = (now - start) % (period * 2);
    const phase = elapsed < period ? elapsed / period : 1 - (elapsed - period) / period;
    const pos = (ease(phase) * 100).toFixed(2);
    for (const el of els) el.style.backgroundPositionY = `${pos}%`;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export default function LogoHeader({ logos }: LogoHeaderProps) {
  // Shuffle client-side only — useMemo with Math.random() runs on server too,
  // producing a different order and causing a hydration mismatch.
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setShuffled([...logos].sort(() => Math.random() - 0.5).slice(0, 10));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (shuffled.length === 0) return;
    return startCopperScroll();
  }, [shuffled.length]);

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
              <pre className="copper-gradient" style={{ overflow: "hidden" }}>
                {logo}
              </pre>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
