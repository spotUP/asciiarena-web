"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type LogoHeaderProps = {
  logos: string[];
};

// Smooth ping-pong copper-bar scroller. CSS animations on background-position
// of background-clip:text elements are silently dropped by Chrome's
// compositor, so the loop sets style.backgroundPosition directly each frame.
// Re-queries each tick so logos that come/go during slide transitions are
// picked up automatically.
function startCopperScroll(): () => void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }
  const period = 10000;
  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const t = ((now - start) % period) / period;
    const wave = (1 - Math.cos(2 * Math.PI * t)) / 2;
    const pos = (wave * 100).toFixed(2);
    const els = document.querySelectorAll<HTMLElement>(".copper-gradient");
    for (const el of els) el.style.backgroundPosition = `0% ${pos}%`;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

const SLIDE_MS = 800;
const SLIDE_EASING = "cubic-bezier(0.65, 0, 0.35, 1)"; // expo-ish ease-in-out

export default function LogoHeader({ logos }: LogoHeaderProps) {
  // Shuffle client-side only — useMemo with Math.random() runs on server too,
  // producing a different order and causing a hydration mismatch.
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const id = setInterval(() => {
      setCurrent(c => {
        setPrev(c);
        return (c + 1) % shuffled.length;
      });
    }, 60000);
    return () => clearInterval(id);
  }, [shuffled.length]);

  // Slide the outgoing logo off the left and the new one in from the right.
  // useLayoutEffect runs after the DOM is updated but before paint, so the
  // first keyframe (incoming at translateX(100%)) is in place before the
  // browser flashes a frame at translateX(0).
  useLayoutEffect(() => {
    if (prev == null) return;
    const container = containerRef.current;
    if (!container) return;
    const prevEl = container.querySelector<HTMLElement>(`[data-logo-idx="${prev}"]`);
    const curEl = container.querySelector<HTMLElement>(`[data-logo-idx="${current}"]`);
    if (prevEl) {
      prevEl.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }],
        { duration: SLIDE_MS, easing: SLIDE_EASING, fill: "forwards" },
      );
    }
    if (curEl) {
      curEl.animate(
        [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
        { duration: SLIDE_MS, easing: SLIDE_EASING, fill: "forwards" },
      );
    }
    const t = setTimeout(() => setPrev(null), SLIDE_MS);
    return () => clearTimeout(t);
  }, [prev, current]);

  return (
    <div className="overflow-hidden d-none d-lg-block mx-auto" ref={containerRef}>
      <div id="logoswitcher" className="logo-stack">
        {shuffled.map((logo, i) => {
          if (i !== current && i !== prev) return null;
          return (
            <div
              key={i}
              data-logo-idx={i}
              className="logo nolink logo-slot"
              style={{ whiteSpace: "pre" }}
            >
              <a href="/" className="logo ascii">
                <pre className="copper-gradient" style={{ overflow: "hidden" }}>
                  {logo}
                </pre>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
