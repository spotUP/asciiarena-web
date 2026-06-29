"use client";

import { useEffect, useRef, useState } from "react";
import { useMusic } from "@/components/music/MusicProvider";
import { isUadePlayable, type ModlandFile } from "@/lib/modland";

const basename = (p: string) => p.split("/").pop() || p;

// Block-ANSI volume bar: a row of 8x16-style cells, magenta when filled.
// Click or drag to set the level.
function VolumeBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const CELLS = 16;
  const filled = Math.round(value * CELLS);
  const setFromX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(Math.max(0, Math.min((clientX - r.left) / r.width, 1)));
  };
  return (
    <div
      ref={ref}
      title="Volume"
      onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setFromX(e.clientX); }}
      onPointerMove={(e) => { if (dragging.current) setFromX(e.clientX); }}
      onPointerUp={(e) => { dragging.current = false; (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); }}
      style={{ flex: 1, minWidth: 0, marginLeft: "4px", display: "flex", gap: "1px", height: "16px", cursor: "pointer", touchAction: "none" }}
    >
      {Array.from({ length: CELLS }).map((_, i) => (
        <div key={i} style={{ flex: 1, background: i < filled ? "#ff55ff" : "#333" }} />
      ))}
    </div>
  );
}

// Minimal Modland music player widget. Backed by the persistent MusicProvider
// engine, so playback continues across (client-side) navigation.
export default function MusicPlayer() {
  const { track, isPlaying, loading, error, volume, search, playFile, playRandom, toggle, stop, setVolume, getAnalyser } = useMusic();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ModlandFile[]>([]);
  const [searching, setSearching] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // FFT as chunky 8x16 blocks (matches the site's character grid). Only loops
  // while playing.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) return;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const analyser = getAnalyser();
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
      if (cssW === 0) return;
      if (canvas.width !== Math.round(cssW * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      if (!analyser) return;
      const bins = analyser.frequencyBinCount;
      const data = new Uint8Array(bins);
      analyser.getByteFrequencyData(data);
      // Spectrum: 8px-wide columns touching (no gap), smooth per-column height
      // on a log frequency scale (bass spread, treble compressed). Smooth (not
      // 16px-stepped) heights keep a proper tapering shape — quantizing to a few
      // 16px blocks collapses loud tunes into solid horizontal bars.
      const barW = 8;
      const nBars = Math.max(1, Math.floor(cssW / barW));
      const minBin = 1, maxBin = Math.min(bins - 1, 220);
      ctx.fillStyle = "#ff55ff";
      for (let i = 0; i < nBars; i++) {
        const lo = Math.floor(minBin * Math.pow(maxBin / minBin, i / nBars));
        const hi = Math.max(lo + 1, Math.floor(minBin * Math.pow(maxBin / minBin, (i + 1) / nBars)));
        let sum = 0, n = 0;
        for (let b = lo; b < hi && b < bins; b++) { sum += data[b]; n++; }
        const v = n ? sum / n / 255 : 0;
        const h = Math.max(1, Math.pow(v, 0.7) * cssH);
        ctx.fillRect(i * barW, cssH - h, barW, h);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [getAnalyser, isPlaying]);

  const doSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await search(q);
      setResults(res.results.filter(isUadePlayable).slice(0, 30));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const btn: React.CSSProperties = {
    background: "transparent", border: "1px solid #555", color: "#aaaaaa",
    cursor: "pointer", fontFamily: "inherit", fontSize: "inherit",
    padding: "0 8px", minHeight: 0, height: "auto", margin: 0, lineHeight: "24px",
  };
  const field: React.CSSProperties = {
    background: "#111", border: "1px solid #555", color: "#aaaaaa",
    fontFamily: "inherit", fontSize: "inherit", padding: "0 6px", lineHeight: "24px",
  };

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">MUSiC PLAYER</h2>
      </div>
      <div className="container col-12 apt-1 apb-1 m-0 p-0 bg-secondary">
        <div style={{ padding: "0 8px" }}>
          {/* Search */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
              placeholder="search modland..."
              style={{ ...field, flex: 1, minWidth: 0 }}
            />
            <button type="button" style={btn} onClick={doSearch}>{searching ? "..." : "Go"}</button>
          </div>

          {/* Results — song name + extension only */}
          {results.length > 0 && (
            <div style={{ maxHeight: "176px", overflowY: "auto", marginBottom: "8px", border: "1px solid #333" }}>
              {results.map((f) => (
                <div
                  key={f.id}
                  onClick={() => playFile(f)}
                  title={`${basename(f.filename)} — ${f.author} [${f.format}]`}
                  style={{
                    padding: "0 6px", lineHeight: "16px", cursor: "pointer", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                    color: track?.path === f.full_path ? "#ff55ff" : "#aaaaaa",
                  }}
                >
                  {basename(f.filename)}
                </div>
              ))}
            </div>
          )}

          {/* Now playing — song name + extension only */}
          <div className="text-truncate" style={{ marginBottom: "6px" }} title={track ? basename(track.title) : undefined}>
            {loading ? <span className="yellow">loading...</span>
              : track ? <span className="yellow">{basename(track.title)}</span>
              : <span style={{ color: "#555" }}>nothing playing</span>}
          </div>
          {error && <div style={{ color: "#ff5555", marginBottom: "6px" }}>{error}</div>}

          {/* FFT block visualizer (8x16 grid) */}
          <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "48px", marginBottom: "8px", background: "#111", imageRendering: "pixelated" }} />

          {/* Transport */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button type="button" style={btn} onClick={toggle} disabled={!track} title="Play/Pause">{isPlaying ? "Pause" : "Play"}</button>
            <button type="button" style={btn} onClick={stop} disabled={!track} title="Stop">Stop</button>
            <button type="button" style={btn} onClick={() => playRandom()} title="Random tune">Random</button>
            <VolumeBar value={volume} onChange={setVolume} />
          </div>
        </div>
      </div>
    </div>
  );
}
