import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { animateScroll } from "@/lib/animateScroll";

// Minimal fake element + controllable rAF clock so we can drive the animation
// frame by frame in the node test environment (no real DOM/raf).
function makeEnv() {
  const el = {
    scrollTop: 0,
    style: { scrollBehavior: "smooth" }, // mimics <html> with scroll-behavior: smooth
  } as unknown as HTMLElement;

  let now = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextId = 1;

  vi.stubGlobal("performance", { now: () => now });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++;
    callbacks.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    callbacks.delete(id);
  });

  // Advance the clock and flush exactly the frames currently queued.
  const advance = (ms: number) => {
    now += ms;
    const due = [...callbacks.entries()];
    callbacks.clear();
    for (const [, cb] of due) cb(now);
  };

  return { el, advance };
}

describe("animateScroll", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // The reported bug: autoplay "just scrolls upwards once" — it scrolled one
  // section then stopped. Root cause: <html> has scroll-behavior: smooth, so the
  // browser re-animated each scrollTop write and overran the rAF loop, firing
  // late scroll events that the stop-on-user-scroll detector mistook for input.
  // The fix forces scroll-behavior: auto while animating.
  it("forces scroll-behavior to 'auto' for the duration of the animation", () => {
    const { el, advance } = makeEnv();

    animateScroll(el, 1000, 700);
    // First frame scheduled synchronously; behavior must already be 'auto'.
    expect(el.style.scrollBehavior).toBe("auto");

    advance(0); // run first frame
    expect(el.style.scrollBehavior).toBe("auto");

    advance(350); // mid-animation
    expect(el.style.scrollBehavior).toBe("auto");
  });

  it("restores the previous scroll-behavior when the animation completes", () => {
    const { el, advance } = makeEnv();
    expect(el.style.scrollBehavior).toBe("smooth");

    let completed = false;
    animateScroll(el, 1000, 700, () => { completed = true; });

    advance(0);
    advance(700); // reach p === 1
    expect(completed).toBe(true);
    expect(el.scrollTop).toBe(1000);
    // Without restoration the page would lose smooth scrolling site-wide.
    expect(el.style.scrollBehavior).toBe("smooth");
  });

  it("cancel() stops further frames and restores scroll-behavior", () => {
    const { el, advance } = makeEnv();

    let completed = false;
    const cancel = animateScroll(el, 1000, 700, () => { completed = true; });

    advance(350); // partway
    const midScroll = el.scrollTop;
    expect(midScroll).toBeGreaterThan(0);
    expect(midScroll).toBeLessThan(1000);

    cancel();
    expect(el.style.scrollBehavior).toBe("smooth"); // restored on cancel

    advance(1000); // no queued frames should run
    expect(el.scrollTop).toBe(midScroll); // animation did not continue
    expect(completed).toBe(false); // onComplete never fired
  });
});
