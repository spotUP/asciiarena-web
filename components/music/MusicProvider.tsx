"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getUadePlayer } from "@/lib/uade/uadePlayer";
import {
  searchModland,
  downloadModlandFile,
  downloadTFMXCompanion,
  downloadUADECompanions,
  isUadePlayable,
  UADE_RANDOM_FORMATS,
  type ModlandFile,
  type ModlandSearchResult,
} from "@/lib/modland";

export interface MusicTrack {
  title: string;
  format: string;
  path: string;
}

interface MusicContextValue {
  track: MusicTrack | null;
  isPlaying: boolean;
  loading: boolean;
  error: string | null;
  volume: number;
  search: (q: string) => Promise<ModlandSearchResult>;
  playFile: (file: ModlandFile) => Promise<void>;
  playRandom: () => Promise<void>;
  toggle: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  getAnalyser: () => AnalyserNode | null;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}

export default function MusicProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.7);
  // Guards against an out-of-order load (user clicks B while A is still loading).
  const loadSeq = useRef(0);

  const search = useCallback((q: string) => searchModland({ q, limit: 40 }), []);

  // Quiet load+play: returns success, sets track/isPlaying on success, never
  // sets the error state itself (callers decide). Used by both playFile and the
  // retrying playRandom.
  const tryLoad = useCallback(async (file: ModlandFile): Promise<boolean> => {
    const seq = ++loadSeq.current;
    try {
      const player = getUadePlayer();
      await player.resume();
      const buffer = await downloadModlandFile(file.full_path);
      const tfmx = await downloadTFMXCompanion(file.full_path);
      if (tfmx) await player.addCompanionFile(tfmx.filename, tfmx.buffer);
      for (const c of await downloadUADECompanions(file.full_path, buffer)) {
        await player.addCompanionFile(c.filename, c.buffer);
      }
      if (seq !== loadSeq.current) return false; // superseded by a newer request
      await player.load(buffer, file.filename); // throws if UADE can't play it
      player.setLooping(true);
      player.play();
      if (seq !== loadSeq.current) return false;
      setTrack({ title: file.filename, format: file.format, path: file.full_path });
      setIsPlaying(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const playFile = useCallback(async (file: ModlandFile) => {
    setLoading(true);
    setError(null);
    const ok = await tryLoad(file);
    if (!ok) setError("Couldn't play this tune");
    setLoading(false);
  }, [tryLoad]);

  const playRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Keep trying random UADE-playable picks until one actually plays —
      // some Modland files are broken or need formats UADE doesn't support.
      for (let attempt = 0; attempt < 12; attempt++) {
        const format = UADE_RANDOM_FORMATS[Math.floor(Math.random() * UADE_RANDOM_FORMATS.length)];
        const offset = Math.floor(Math.random() * 400);
        const res = await searchModland({ format, limit: 50, offset });
        const playable = res.results.filter(isUadePlayable);
        if (!playable.length) continue;
        const pick = playable[Math.floor(Math.random() * playable.length)];
        if (await tryLoad(pick)) return;
      }
      setError("Couldn't find a playable tune");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search unavailable");
    } finally {
      setLoading(false);
    }
  }, [tryLoad]);

  const toggle = useCallback(() => {
    const player = getUadePlayer();
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else if (track) {
      void player.resume();
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, track]);

  const stop = useCallback(() => {
    getUadePlayer().stop();
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((v: number) => {
    getUadePlayer().setVolume(v);
    setVolumeState(v);
  }, []);

  const getAnalyser = useCallback(() => getUadePlayer().getAnalyser(), []);

  // Persist what's playing so a full page reload (F5, post-deploy chunk reload,
  // a non-Link navigation) can recover. Client-side <Link> nav keeps the engine
  // alive and never hits this; only real document loads do. Web Audio can't be
  // resumed without a user gesture in the new document, so we re-arm on the
  // next interaction rather than silently autoplaying.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    try {
      if (track && isPlaying) sessionStorage.setItem("uade.resume", JSON.stringify(track));
      else sessionStorage.removeItem("uade.resume");
    } catch { /* storage unavailable */ }
  }, [track, isPlaying]);

  useEffect(() => {
    let saved: MusicTrack | null = null;
    try {
      const r = sessionStorage.getItem("uade.resume");
      if (r) saved = JSON.parse(r) as MusicTrack;
    } catch { /* */ }
    if (!saved) return;
    setTrack(saved); // show the last tune immediately
    const file: ModlandFile = {
      id: 0, format: saved.format, author: "", filename: saved.title,
      full_path: saved.path, extension: saved.title.split(".").pop() || "",
    };
    const onFirst = () => { document.removeEventListener("pointerdown", onFirst); void tryLoad(file); };
    document.addEventListener("pointerdown", onFirst, { once: true });
    return () => document.removeEventListener("pointerdown", onFirst);
  }, [tryLoad]);

  const value: MusicContextValue = {
    track, isPlaying, loading, error, volume,
    search, playFile, playRandom, toggle, stop, setVolume, getAnalyser,
  };
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
