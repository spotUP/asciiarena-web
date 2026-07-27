"use client";

import { useEffect } from "react";

// Recovers a tab whose code-split chunks no longer exist on the server.
//
// Every build mints new content-hashed chunk filenames. deploy.sh keeps the
// previous builds' chunks around for 14 days precisely so an open tab survives
// a deploy — that is the real fix, and it covers every ordinary case. This
// guard covers what retention cannot: a tab left open longer than the window,
// or a chunk that genuinely went away.
//
// The failure is silent and permanent without it. The user clicks something
// that lazy-loads (a next/dynamic panel, a route segment), the request 404s,
// and the interaction just never happens.

const RELOAD_MARKER = "asciiarena.chunkReloadAt";
// One reload attempt per minute. If a reload does not fix it the problem is not
// a stale chunk, and reloading again would spin.
const RELOAD_COOLDOWN_MS = 60_000;

function isChunkLoadError(value: unknown): boolean {
  if (!value) return false;
  const name = (value as { name?: unknown }).name;
  if (typeof name === "string" && name === "ChunkLoadError") return true;
  const message = (value as { message?: unknown }).message;
  if (typeof message !== "string") return false;
  // Webpack, Turbopack and the browser each word this differently.
  return /Loading chunk .* failed/i.test(message)
    || /Failed to load chunk/i.test(message)
    || /Loading CSS chunk .* failed/i.test(message)
    || /error loading dynamically imported module/i.test(message)
    || /Importing a module script failed/i.test(message);
}

function reloadOnce(): void {
  let last = 0;
  try {
    last = Number(window.sessionStorage.getItem(RELOAD_MARKER) ?? 0);
  } catch { /* storage blocked - fall through and allow one reload */ }
  if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
  try {
    window.sessionStorage.setItem(RELOAD_MARKER, String(Date.now()));
  } catch { /* ignore */ }
  window.location.reload();
}

export default function ChunkReloadGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError(event)) reloadOnce();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) reloadOnce();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
