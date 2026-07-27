"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getUadePlayer } from "@/lib/uade/uadePlayer";
import {
  searchModland,
  downloadModlandFile,
  downloadTFMXCompanion,
  downloadUADECompanions,
  isUadePlayable,
  getModlandFormats,
  chooseRandomFormat,
  randomOffset,
  UADE_RANDOM_FORMATS,
  type ModlandFile,
  type ModlandFormatCount,
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
  // Per-format catalog counts, fetched once and reused to weight random picks.
  const formatsRef = useRef<ModlandFormatCount[] | null>(null);
  // A tune restored from a previous page load, shown in the player but not
  // loaded into the engine. Loaded on the reader's first press of play.
  const pendingResumeRef = useRef<ModlandFile | null>(null);

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
    } catch (e) {
      // Rate limiting is fatal for this attempt — propagate so callers stop
      // retrying (and hammering the shared upstream) and show a clear message.
      if (e instanceof Error && /rate limit/i.test(e.message)) throw e;
      return false;
    }
  }, []);

  const playFile = useCallback(async (file: ModlandFile) => {
    setLoading(true);
    setError(null);
    try {
      if (!(await tryLoad(file))) setError("Couldn't play this tune");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
    } finally {
      setLoading(false);
    }
  }, [tryLoad]);

  const playRandom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Per-format counts (cached) let us pick a format weighted by catalog size
      // and span its FULL offset range — so random actually covers the whole
      // Modland library instead of the first page of a few formats.
      if (!formatsRef.current) formatsRef.current = await getModlandFormats();
      const counts = formatsRef.current;
      const LIMIT = 50;
      // Keep trying random UADE-playable picks until one actually plays —
      // some Modland files are broken or need formats UADE doesn't support.
      for (let attempt = 0; attempt < 12; attempt++) {
        const chosen = counts.length ? chooseRandomFormat(counts, Math.random()) : null;
        const format = chosen?.format ?? UADE_RANDOM_FORMATS[Math.floor(Math.random() * UADE_RANDOM_FORMATS.length)];
        const count = chosen?.count ?? 500;
        const offset = randomOffset(count, LIMIT, Math.random());
        const res = await searchModland({ format, limit: LIMIT, offset });
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
      return;
    }
    // A track restored from a previous page load is shown in the player but
    // its module was never loaded into the engine, so player.play() would do
    // nothing. Load it now — this is the reader pressing play, which is the
    // only thing that may start sound.
    const pending = pendingResumeRef.current;
    if (pending) {
      pendingResumeRef.current = null;
      void playFile(pending);
      return;
    }
    if (track) {
      void player.resume();
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, track, playFile]);

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
    // Armed, NOT started. The reader gets the tune back in the player, and it
    // begins only when they press play.
    //
    // This used to load and play on the first pointerdown anywhere in the
    // document, so any click on any page resumed music the reader never asked
    // for. A user gesture is what the browser's autoplay policy needs; it is
    // not consent to hear something.
    pendingResumeRef.current = file;
  }, []);

  const value: MusicContextValue = {
    track, isPlaying, loading, error, volume,
    search, playFile, playRandom, toggle, stop, setVolume, getAnalyser,
  };
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
