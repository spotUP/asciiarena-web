"use client";

import { useEffect, useState } from "react";
import AnsiLogo from "@/components/ui/AnsiLogo";

/**
 * A post's ANSI attachment.
 *
 * Renders with the editor's own engine so the art looks exactly as it was
 * drawn, in any of the ~90 fonts the editor offers. AnsiLove is the fallback:
 * it only covers nine fonts, but if the engine render throws -- a corrupt
 * file, a font PNG that 404s -- a slightly-wrong picture beats a blank box.
 *
 * The engine modules are imported lazily so the ~200KB of editor code never
 * lands in the bundle of a page with no ANSI posts on it.
 */
export default function AnsiPost({ ansiB64, font }: { ansiB64: string; font: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    import("@/components/ui/AnsiEditor/render")
      .then(m => m.renderAnsiB64(ansiB64))
      .then(out => {
        if (!cancelled) setSrc(out.url);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn("[AnsiPost] engine render failed, falling back to AnsiLove", err);
        setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ansiB64]);

  if (failed) return <AnsiLogo ansiB64={ansiB64} font={font} maxHeight={800} />;

  if (!src) {
    return (
      <div className="lightgrey" style={{ height: "16px", lineHeight: "16px" }}>
        Rendering...
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="ANSI art"
      // Never scaled UP. These are 8x16 bitmap glyphs: stretching 808px of art
      // across a 975px post is a 1.21x scale, which duplicates some pixel
      // columns and not others, so stems come out uneven widths and the font
      // reads as wrong. Art narrower than the post simply sits at its own size.
      //
      // max-width still shrinks art WIDER than the post, which is unavoidable --
      // the alternative is cutting it off -- but that is the rarer case and
      // losing detail beats losing the right-hand side.
      //
      // Posts drawn now are sized to the composer's width (columnsForPanel), so
      // they fill it at 1:1 without any scaling at all.
      style={{ maxWidth: "100%", height: "auto", imageRendering: "pixelated", display: "block" }}
    />
  );
}
