"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface Init386 {
  (options: {
    fastLoad?: boolean;
    onePass?: boolean;
    speedFactor?: number;
    background?: string;
    cursorColor?: string;
  }): void;
}

let cachedInit: Init386 | null = null;

// Bypass the Next.js / TypeScript bundler's static analysis of import() so
// the browser does the dynamic ES module import at runtime against the
// public URL.
const browserImport = new Function("url", "return import(url)") as (
  url: string
) => Promise<{ default: Init386 }>;

async function getInit386(): Promise<Init386> {
  if (cachedInit) return cachedInit;
  const mod = await browserImport("/assets/js/386-animation/index.js");
  cachedInit = mod.default;
  return cachedInit;
}

function cleanup() {
  for (const id of ["wrap386", "bar386", "cursor386"]) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

interface Props {
  enabled: boolean;
}

/**
 * Runs the BBS-style screen-redraw animation on initial mount AND on every
 * SPA route change while `enabled` is true. When disabled, leaves the page
 * visible immediately and skips the animation.
 *
 * The body starts with visibility:hidden (set by 386.css). On every run the
 * 386-animation script reveals it once the redraw bar reaches the top.
 */
export default function ModemAnim({ enabled }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) {
      document.body.style.visibility = "visible";
      cleanup();
      return;
    }

    let cancelled = false;
    cleanup();
    document.body.style.visibility = "hidden";

    getInit386()
      .then((init) => {
        if (cancelled) return;
        init({
          onePass: true,
          speedFactor: 4,
          background: "#000000",
          cursorColor: "#ff0000",
        });
      })
      .catch(() => {
        document.body.style.visibility = "visible";
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, pathname]);

  return null;
}
