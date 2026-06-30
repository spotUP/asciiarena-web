"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SiteLogo } from "./SiteLayout";
import AnsiLogo from "@/components/ui/AnsiLogo";

export type LogoHeaderProps = {
  logos: SiteLogo[];
};

// The whole site is on a strict 8x16 grid, so an ASCII logo's height is its
// line count x 16. ANSI logos render async to an <img>; we cap them at a
// fixed height so they slot into the same frame.
const GRID_ROW_PX = 16;
const ANSI_LOGO_PX = 160;
const MIN_FRAME_PX = 96;

// Static header height = the tallest logo, computed from the logo data so it
// is identical on the server and client (no hydration mismatch) and never
// changes as logos rotate. Every logo is then vertically centred inside it,
// which is what kills the first-paint height jump: the frame is already its
// final height before any logo has rendered.
function frameHeightPx(logos: SiteLogo[]): number {
  let max = MIN_FRAME_PX;
  for (const logo of logos) {
    if (logo.kind === "ascii") {
      const lines = logo.ascii.replace(/\n+$/, "").split("\n").length;
      max = Math.max(max, lines * GRID_ROW_PX);
    } else {
      max = Math.max(max, ANSI_LOGO_PX);
    }
  }
  return max;
}

// Smooth ping-pong copper-bar scroller. CSS animations on background-position
// of background-clip:text elements are silently dropped by Chrome's
// compositor, so the loop sets style.backgroundPosition directly each frame.
// Re-queries each tick so logos that come/go during slide transitions are
// picked up automatically. Only targets .copper-gradient (ASCII slots) — ANSI
// images keep their own colours.
function startCopperScroll(): () => void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }
  const period = 10000;
  const start = performance.now();
  let raf = 0;
  // Cache the .copper-gradient elements instead of re-querying the DOM on
  // every frame (60x/sec, continuous). Re-query at most ~2x/sec so logos
  // that slide in/out are still picked up without the per-frame query cost.
  let els: NodeListOf<HTMLElement> = document.querySelectorAll<HTMLElement>(".copper-gradient");
  let lastQuery = start;
  const tick = (now: number) => {
    if (now - lastQuery > 500) {
      els = document.querySelectorAll<HTMLElement>(".copper-gradient");
      lastQuery = now;
    }
    const t = ((now - start) % period) / period;
    const wave = (1 - Math.cos(2 * Math.PI * t)) / 2;
    const pos = (wave * 100).toFixed(2);
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
  const [shuffled, setShuffled] = useState<SiteLogo[]>([]);
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
      <div className="logo-header-frame" style={{ height: `${frameHeightPx(logos)}px` }}>
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
                <Link href="/" className="logo ascii">
                  {logo.kind === "ansi" ? (
                    <AnsiLogo ansiB64={logo.ansiB64} font={logo.font} maxHeight={ANSI_LOGO_PX} transparentBg />
                  ) : (
                    <pre className="copper-gradient" style={{ overflow: "hidden" }}>
                      {logo.ascii}
                    </pre>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
