"use client";

import { useEffect, useRef, useState } from "react";
import { useMusic } from "@/components/music/MusicProvider";
import { isUadePlayable, type ModlandFile } from "@/lib/modland";

// Minimal Modland music player widget. Backed by the persistent MusicProvider
// engine, so playback continues across navigation.
export default function MusicPlayer() {
  const { track, isPlaying, loading, error, volume, search, playFile, playRandom, toggle, stop, setVolume, getAnalyser } = useMusic();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ModlandFile[]>([]);
  const [searching, setSearching] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // FFT bars driven by the engine's AnalyserNode. Only loops while playing.
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
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (!analyser) return;
      const bins = analyser.frequencyBinCount;
      const data = new Uint8Array(bins);
      analyser.getByteFrequencyData(data);
      const bars = 32;
      const step = Math.floor(bins / bars);
      const bw = w / bars;
      ctx.fillStyle = "#ff55ff";
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += data[i * step + j];
        const v = sum / step / 255;
        const bh = Math.max(1, v * h);
        ctx.fillRect(i * bw, h - bh, Math.max(1, bw - 1), bh);
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
    cursor: "pointer", fontFamily: "inherit", fontSize: "13px", padding: "2px 8px",
    minHeight: 0, height: "auto", margin: 0,
  };

  return (
    <div className="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
      <div className="header col-lg-12 p-0">
        <h2 className="ap-1 bg-header">MUSiC PLAYER</h2>
      </div>
      <div className="container col-12 apt-1 apb-1 m-0 p-0 bg-secondary" style={{ fontFamily: "monospace", fontSize: "13px" }}>
        <div className="pl-lg-2 pr-lg-2" style={{ padding: "0 8px" }}>
          {/* Search */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
              placeholder="search modland..."
              style={{ flex: 1, minWidth: 0, background: "#111", border: "1px solid #555", color: "#aaaaaa", fontFamily: "inherit", fontSize: "13px", padding: "2px 6px" }}
            />
            <button type="button" style={btn} onClick={doSearch}>{searching ? "..." : "Go"}</button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div style={{ maxHeight: "160px", overflowY: "auto", marginBottom: "6px", border: "1px solid #333" }}>
              {results.map((f) => (
                <div
                  key={f.id}
                  onClick={() => playFile(f)}
                  title={`${f.filename} — ${f.author} [${f.format}]`}
                  style={{
                    padding: "1px 6px", cursor: "pointer", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                    color: track?.path === f.full_path ? "#ff55ff" : "#aaaaaa",
                  }}
                >
                  <span style={{ color: "#555" }}>{f.format}</span>{" "}{f.filename}
                </div>
              ))}
            </div>
          )}

          {/* Now playing */}
          <div className="text-truncate" style={{ marginBottom: "4px" }} title={track?.title}>
            {loading ? <span className="yellow">loading...</span>
              : track ? <><span className="yellow">{track.title}</span> <span style={{ color: "#555" }}>[{track.format}]</span></>
              : <span style={{ color: "#555" }}>nothing playing</span>}
          </div>
          {error && <div style={{ color: "#ff5555", marginBottom: "4px" }}>{error}</div>}

          {/* FFT */}
          <canvas ref={canvasRef} width={256} height={32} style={{ display: "block", width: "100%", height: "32px", marginBottom: "6px", background: "#111", imageRendering: "pixelated" }} />

          {/* Transport */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button type="button" style={btn} onClick={toggle} disabled={!track} title="Play/Pause">{isPlaying ? "Pause" : "Play"}</button>
            <button type="button" style={btn} onClick={stop} disabled={!track} title="Stop">Stop</button>
            <button type="button" style={btn} onClick={() => playRandom()} title="Random tune">Random</button>
            <input
              type="range" min={0} max={1} step={0.05} value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              title="Volume"
              style={{ flex: 1, minWidth: 0, marginLeft: "4px", accentColor: "#ff55ff" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
