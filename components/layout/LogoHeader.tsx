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
  // Sinusoidal ping-pong: position = (1 - cos(2π·t/period)) / 2, mapped to
  // 0–100%. Cosine naturally reverses at the peaks, so the gradient eases
  // into each turn-around without us having to stitch two ease curves.
  // 10s full cycle (5s up, 5s down). Slow enough to feel deliberate, fast
  // enough that the palette shift is visible without staring.
  const period = 10000;
  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const t = ((now - start) % period) / period; // 0..1
    // 0 at t=0, 1 at t=0.5, 0 at t=1 — natural ping-pong shape.
    const wave = (1 - Math.cos(2 * Math.PI * t)) / 2;
    const pos = (wave * 100).toFixed(2);
    // Setting the full shorthand (not the longhand backgroundPositionY)
    // because the CSS uses `background-position: 0% 0%` shorthand — some
    // browsers don't compose a longhand inline-style write over a shorthand
    // stylesheet rule cleanly, and on background-clip:text elements that
    // can leave the gradient frozen at the initial frame.
    for (const el of els) el.style.backgroundPosition = `0% ${pos}%`;
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
