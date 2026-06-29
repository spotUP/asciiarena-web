// Smoothly animate an element's scrollTop to a target using our own easing.
//
// Returns a cancel() function that stops the animation and restores state.
// The cancel function IS the cancellation handle on purpose: returning a raw
// requestAnimationFrame id can never cancel a running animation, because only
// the first frame's id would be captured — every later frame schedules a new
// id the caller never sees.
//
// Critically, the page sets `scroll-behavior: smooth` on <html>. With that in
// effect, each `el.scrollTop = ...` write is itself re-animated by the browser
// and overruns our rAF loop by ~1s, firing scroll events long after the
// animation "ends". Consumers that watch scroll events to detect a *user*
// scroll (e.g. autoplay's stop-on-scroll) then mistake those late programmatic
// events for user input. So we force `scroll-behavior: auto` for the duration
// of the animation — making our easing the only animation — and restore the
// previous value when the animation completes or is cancelled.
export function animateScroll(
  el: HTMLElement,
  target: number,
  duration: number,
  onComplete?: () => void,
): () => void {
  const from = el.scrollTop;
  const delta = target - from;
  const t0 = performance.now();
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const prevBehavior = el.style.scrollBehavior;
  el.style.scrollBehavior = "auto";

  let raf = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    el.style.scrollBehavior = prevBehavior;
  };

  const tick = (now: number) => {
    const p = Math.min((now - t0) / duration, 1);
    el.scrollTop = from + delta * ease(p);
    if (p < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      finish();
      onComplete?.();
    }
  };

  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    finish();
  };
}
