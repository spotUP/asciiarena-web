// Beat detection for groove-synced autoplay. Pure and DOM-free so it can be
// unit-tested: feed it the low-band (kick) energy each frame and it returns
// whether this frame is a beat onset. Classic "energy above local average"
// onset detection with a refractory window to avoid double-triggering.

/** Normalised 0..1 energy of the lowest `bins` FFT bins (the kick/bass band). */
export function lowBandEnergy(freq: Uint8Array | number[], bins = 8): number {
  const n = Math.min(bins, freq.length);
  if (n === 0) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += freq[i];
  return s / (n * 255);
}

export interface BeatDetectorOptions {
  windowSize?: number; // frames of history for the local average (~1s at 60fps)
  sensitivity?: number; // energy must exceed average * sensitivity to be a beat
  refractoryMs?: number; // minimum gap between beats
  floor?: number; // ignore beats below this absolute energy (silence/noise)
}

export class BeatDetector {
  private hist: number[] = [];
  private lastBeatMs = -Infinity;
  private readonly windowSize: number;
  private readonly sensitivity: number;
  private readonly refractoryMs: number;
  private readonly floor: number;

  constructor(opts: BeatDetectorOptions = {}) {
    this.windowSize = opts.windowSize ?? 43;
    this.sensitivity = opts.sensitivity ?? 1.4;
    this.refractoryMs = opts.refractoryMs ?? 220;
    this.floor = opts.floor ?? 0.02;
  }

  /** Push one frame's energy at time tMs; returns true on a beat onset. */
  detect(energy: number, tMs: number): boolean {
    this.hist.push(energy);
    if (this.hist.length > this.windowSize) this.hist.shift();
    const mean = this.hist.reduce((a, b) => a + b, 0) / this.hist.length;
    const isBeat =
      this.hist.length >= 8 &&
      energy >= this.floor &&
      energy > mean * this.sensitivity &&
      tMs - this.lastBeatMs >= this.refractoryMs;
    if (isBeat) this.lastBeatMs = tMs;
    return isBeat;
  }

  reset(): void {
    this.hist = [];
    this.lastBeatMs = -Infinity;
  }
}
