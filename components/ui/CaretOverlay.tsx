"use client";

import { useEffect } from "react";

/**
 * Site-wide Amiga-style block caret overlay.
 *
 * Replaces the native browser caret on text inputs / textareas with a
 * red blinking block that visually matches the SiteWall's cursor-block.
 *
 * How it works:
 *   1. One delegated `focus` listener on `document`. When a text-like
 *      input/textarea gets focus, we hide its native caret with
 *      `caret-color: transparent !important` (the CSS fallback red caret
 *      stays in place for any input we don't track).
 *   2. A hidden "mirror" `<div>` copies the focused input's font / padding
 *      / line-height / etc. We push the input's text up to `selectionStart`
 *      into the mirror, then place a `<span>` marker at that position.
 *      The marker's `offsetLeft` / `offsetTop` (minus the input's scroll)
 *      gives the pixel coordinates of the caret.
 *   3. A single absolutely-positioned `<span class="cursor-block">` is
 *      moved to that point, blinking via the existing `@keyframes blink`.
 *   4. We re-measure on `input`, `keyup`, `click`, `select`, `scroll`,
 *      `resize`, and `transitionend` so the block follows the caret
 *      through every interaction.
 *   5. On blur, we hide the overlay and restore the native caret.
 *
 * Inputs that should keep the native UI are skipped:
 *   - password / number / date / time / color / file / range / checkbox / radio
 *   - inputs that aren't focusable text (button, submit, reset)
 *   - contenteditable elements (different caret model)
 */
export default function CaretOverlay() {
  useEffect(() => {
    // Skip on the popout chat windows — they manage their own minimal chrome
    // and shouldn't have the overlay element bleeding into the small window.
    if (window.location.pathname.startsWith("/chat/window/")) return;

    // The visible caret block.
    const block = document.createElement("span");
    block.className = "cursor-block-overlay";
    // Fixed positioning so the caret stays glued to its input regardless of
    // whether the input is in a scrolled document body or a position:fixed
    // container (e.g. the chat dock). We re-measure on scroll/resize so
    // either case keeps the caret aligned.
    block.style.position = "fixed";
    block.style.pointerEvents = "none";
    block.style.display = "none";
    block.style.zIndex = "2147483646"; // just below MAX_INT so dropdowns can sit above
    block.style.background = "#ff5555";
    block.style.animation = "blink 1s step-end infinite";
    document.body.appendChild(block);

    // The hidden mirror used for caret-position measurement.
    const mirror = document.createElement("div");
    mirror.style.position = "absolute";
    mirror.style.top = "-9999px";
    mirror.style.left = "-9999px";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre"; // single-line by default; overridden per input
    mirror.setAttribute("aria-hidden", "true");
    document.body.appendChild(mirror);

    type TextInput = HTMLInputElement | HTMLTextAreaElement;

    const trackableTypes = new Set([
      "text", "search", "url", "email", "tel", "",
    ]);

    function isTrackable(el: Element | null): el is TextInput {
      if (!el) return false;
      if (el instanceof HTMLTextAreaElement) return true;
      if (el instanceof HTMLInputElement) return trackableTypes.has(el.type);
      return false;
    }

    let tracked: TextInput | null = null;
    // Save the input's original caret-color so we can restore on blur.
    let savedCaretColor: string | null = null;

    function updatePosition() {
      if (!tracked) return;
      const el = tracked;
      const value = el.value ?? "";
      const caretIdx = el.selectionStart ?? value.length;

      const cs = getComputedStyle(el);
      // Copy enough style for accurate text-width measurement.
      const propsToCopy = [
        "fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing",
        "textTransform", "wordSpacing", "textIndent", "lineHeight",
        "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
        "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
        "borderStyle", "boxSizing", "tabSize",
      ] as const;
      const mirrorStyle = mirror.style as unknown as Record<string, string>;
      const inputStyle = cs as unknown as Record<string, string>;
      for (const p of propsToCopy) {
        mirrorStyle[p] = inputStyle[p];
      }
      const isTextarea = el instanceof HTMLTextAreaElement;
      mirror.style.whiteSpace = isTextarea ? "pre-wrap" : "pre";
      mirror.style.wordWrap = isTextarea ? "break-word" : "normal";
      mirror.style.width = isTextarea ? `${el.clientWidth}px` : "auto";
      mirror.style.height = "auto";
      mirror.style.overflow = "hidden";

      // Pre-caret text + marker span.
      mirror.textContent = value.substring(0, caretIdx);
      const marker = document.createElement("span");
      marker.textContent = caretIdx === value.length ? "​" : "";
      mirror.appendChild(marker);

      // 8x16 terminal grid: one cell is 8 wide x 16 tall.
      const CELL_W = 8;
      const CELL_H = 16;

      const rect = el.getBoundingClientRect();
      const lineHeight = parseFloat(cs.lineHeight) || CELL_H;
      // Inputs in this site are 48px tall with 16px line-height, so the
      // browser vertically centres their text. Add that offset so the caret
      // sits with the text, not on the first grid row above it. Textareas
      // are top-aligned, so no offset.
      const isTextareaEl = el instanceof HTMLTextAreaElement;
      const verticalCentre = isTextareaEl
        ? 0
        : Math.max(0, (el.clientHeight - lineHeight) / 2);

      // Viewport-relative coords (position:fixed): no scrollX/scrollY added.
      const x = rect.left + marker.offsetLeft - el.scrollLeft;
      const y = rect.top + verticalCentre + marker.offsetTop - el.scrollTop;

      block.style.display = "block";
      block.style.left = `${x}px`;
      block.style.top = `${y}px`;
      block.style.width = `${CELL_W}px`;
      block.style.height = `${CELL_H}px`;
    }

    function startTracking(el: TextInput) {
      if (tracked === el) return;
      stopTracking();
      tracked = el;
      savedCaretColor = el.style.caretColor || null;
      el.style.caretColor = "transparent";
      el.addEventListener("input", updatePosition);
      el.addEventListener("keyup", updatePosition);
      el.addEventListener("click", updatePosition);
      el.addEventListener("select", updatePosition);
      el.addEventListener("scroll", updatePosition);
      // Schedule one frame later so layout is settled when focus arrives.
      requestAnimationFrame(updatePosition);
    }

    function stopTracking() {
      if (!tracked) return;
      tracked.removeEventListener("input", updatePosition);
      tracked.removeEventListener("keyup", updatePosition);
      tracked.removeEventListener("click", updatePosition);
      tracked.removeEventListener("select", updatePosition);
      tracked.removeEventListener("scroll", updatePosition);
      // Restore inline caret-color so the CSS fallback can take over again.
      if (savedCaretColor !== null) tracked.style.caretColor = savedCaretColor;
      else tracked.style.removeProperty("caret-color");
      savedCaretColor = null;
      tracked = null;
      block.style.display = "none";
    }

    function onFocusIn(e: FocusEvent) {
      const t = e.target as Element | null;
      if (isTrackable(t)) startTracking(t);
      else stopTracking();
    }

    function onFocusOut(e: FocusEvent) {
      if (e.target === tracked) stopTracking();
    }

    function onWindowChange() {
      if (tracked) updatePosition();
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);

    // If something already has focus on mount (rare for SPA but possible
    // for popouts or modal autofocus), pick it up now.
    if (isTrackable(document.activeElement)) startTracking(document.activeElement);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
      stopTracking();
      block.remove();
      mirror.remove();
    };
  }, []);

  return null;
}
