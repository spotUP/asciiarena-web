"use client";
import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$|/\\<>[]{}*+-=";

function rnd() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export type ScrambleMode = "entering" | "leaving" | "stable";

interface Props {
  text: string;
  mode: ScrambleMode;
  // ms per character step — total duration = text.length * perCharMs
  perCharMs?: number;
}

export default function ScrambleText({ text, mode, perCharMs = 45 }: Props) {
  const [display, setDisplay] = useState<string>(
    mode === "entering" ? text.replace(/./g, rnd) : text
  );
  const rafRef = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    if (mode === "stable") {
      setDisplay(text);
      return;
    }

    const len = text.length;
    const startTime = Date.now();

    function frame() {
      const progress = Math.min((Date.now() - startTime) / (len * perCharMs), 1);
      const lockedCount = Math.floor(progress * len);

      if (mode === "entering") {
        // Lock chars left-to-right, scramble the rest each frame
        setDisplay(
          text
            .split("")
            .map((c, i) => (i < lockedCount ? c : rnd()))
            .join("")
        );
      } else {
        // Corrupt chars right-to-left, keep the rest each frame
        const corruptFrom = len - lockedCount;
        setDisplay(
          text
            .split("")
            .map((c, i) => (i >= corruptFrom ? rnd() : c))
            .join("")
        );
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setDisplay(mode === "entering" ? text : text.replace(/./g, rnd));
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, text, perCharMs]);

  return <>{display}</>;
}
