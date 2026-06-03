// Client-only audio for the chat "[!]" alert. Browsers block audio that isn't
// tied to a user gesture, so we unlock once on the first pointer interaction and
// reuse a single preloaded element thereafter.

let audio: HTMLAudioElement | null = null;
let unlocked = false;

function el(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio("/sounds/chat-alert.wav");
    audio.preload = "auto";
  }
  return audio;
}

export function unlockChatAudio(): void {
  const a = el();
  if (!a || unlocked) return;
  a.muted = true;
  a.play()
    .then(() => {
      a.pause();
      a.currentTime = 0;
      a.muted = false;
      unlocked = true;
    })
    .catch(() => {
      a.muted = false;
    });
}

export function playChatAlert(): void {
  const a = el();
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {
    /* still locked / blocked — the window flash is the visual fallback */
  });
}

// Self-install: unlock on the very first user gesture anywhere on the page, so a
// later SSE-driven alert can play without its own gesture.
if (typeof window !== "undefined") {
  const onFirstGesture = (): void => {
    unlockChatAudio();
    window.removeEventListener("pointerdown", onFirstGesture);
  };
  window.addEventListener("pointerdown", onFirstGesture, { once: true });
}
