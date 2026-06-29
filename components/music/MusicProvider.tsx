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

  const playFile = useCallback(async (file: ModlandFile) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    try {
      const player = getUadePlayer();
      await player.resume();
      const buffer = await downloadModlandFile(file.full_path);
      // Two-file formats need their companion in the WASM FS before load().
      const tfmx = await downloadTFMXCompanion(file.full_path);
      if (tfmx) await player.addCompanionFile(tfmx.filename, tfmx.buffer);
      for (const c of await downloadUADECompanions(file.full_path, buffer)) {
        await player.addCompanionFile(c.filename, c.buffer);
      }
      if (seq !== loadSeq.current) return; // superseded by a newer click
      await player.load(buffer, file.filename);
      player.setLooping(true);
      player.play();
      if (seq !== loadSeq.current) return;
      setTrack({ title: file.filename, format: file.format, path: file.full_path });
      setIsPlaying(true);
    } catch (e) {
      if (seq === loadSeq.current) setError(e instanceof Error ? e.message : "Playback failed");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  const playRandom = useCallback(async () => {
    setError(null);
    try {
      // Pick a random UADE-playable format + offset for variety.
      for (let attempt = 0; attempt < 4; attempt++) {
        const format = UADE_RANDOM_FORMATS[Math.floor(Math.random() * UADE_RANDOM_FORMATS.length)];
        const offset = attempt === 3 ? 0 : Math.floor(Math.random() * 400);
        const res = await searchModland({ format, limit: 50, offset });
        const playable = res.results.filter(isUadePlayable);
        if (playable.length) {
          await playFile(playable[Math.floor(Math.random() * playable.length)]);
          return;
        }
      }
      setError("No tunes found");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search unavailable");
    }
  }, [playFile]);

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

  // Keep the singleton's looping callback tidy on unmount (provider lives for
  // the app lifetime, but be safe in fast-refresh / tests).
  useEffect(() => () => { /* engine is a singleton; intentionally not torn down */ }, []);

  const value: MusicContextValue = {
    track, isPlaying, loading, error, volume,
    search, playFile, playRandom, toggle, stop, setVolume, getAnalyser,
  };
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
