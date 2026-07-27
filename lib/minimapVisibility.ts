"use client";

import { useCallback, useEffect, useState } from "react";

// Whether the release page shows the logo minimap next to the art.
//
// It used to be unconditional, which broke two ways: it does not work at all
// on mobile, and on a small secondary monitor its 120px strip eats about a
// third of the usable colly width with no way to turn it off.

/**
 * Narrowest viewport that still has room for the art AND the minimap beside
 * it. Below this the minimap is off regardless of preference — that covers
 * phones and tablets, where it does not work anyway.
 */
export const MINIMAP_MIN_VIEWPORT_WIDTH = 1024;

const STORAGE_KEY = "asciiarena.minimap";

/** True when a viewport of this width has room for art plus minimap. */
export function viewportAllowsMinimap(width: number): boolean {
  return width >= MINIMAP_MIN_VIEWPORT_WIDTH;
}

export interface MinimapVisibilityInput {
  /** Result of `viewportAllowsMinimap` for the current window. */
  viewportAllows: boolean;
  /** The reader's explicit choice. Defaults to on. */
  userEnabled: boolean;
  /** Logo entries in the colly — a one-entry minimap navigates nothing. */
  entryCount: number;
  isFullscreen: boolean;
}

export function shouldShowMinimap({ viewportAllows, userEnabled, entryCount, isFullscreen }: MinimapVisibilityInput): boolean {
  if (isFullscreen) return false;
  if (entryCount <= 1) return false;
  if (!viewportAllows) return false;
  return userEnabled;
}

/** True when the viewport is wide enough for the minimap to be offered at all. */
export function useViewportAllowsMinimap(): boolean {
  // Server render and first paint assume a desktop viewport, matching the
  // markup the server produced; the resize effect corrects it immediately.
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const update = () => setWide(viewportAllowsMinimap(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return wide;
}

/**
 * The reader's minimap preference, persisted in localStorage so it survives
 * navigation and reloads (and works logged out, unlike the account-level
 * viewer preferences).
 */
export function useMinimapPreference(): { enabled: boolean; toggle: () => void } {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(STORAGE_KEY) !== "off");
    } catch { /* private mode / storage disabled — keep the default */ }
  }, []);
  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off"); } catch { /* ignore */ }
      return next;
    });
  }, []);
  return { enabled, toggle };
}
