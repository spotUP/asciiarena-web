import { describe, it, expect } from "vitest";
import { BeatDetector, lowBandEnergy } from "@/lib/uade/beatDetector";

describe("lowBandEnergy", () => {
  it("is 0 for silence and 1 for full-scale low bins", () => {
    expect(lowBandEnergy(new Uint8Array(64))).toBe(0);
    expect(lowBandEnergy(new Uint8Array(64).fill(255), 8)).toBe(1);
  });

  it("averages only the lowest bins", () => {
    const f = new Uint8Array(64);
    f.fill(255, 0, 8); // low bins full, rest zero
    expect(lowBandEnergy(f, 8)).toBe(1);
    f.fill(0);
    f.fill(255, 0, 4); // half the low bins full
    expect(lowBandEnergy(f, 8)).toBeCloseTo(0.5, 5);
  });
});

describe("BeatDetector", () => {
  // 60fps frame times
  const frame = (i: number) => i * 16.7;

  it("does not fire on steady energy (no onset above the local average)", () => {
    const d = new BeatDetector();
    let beats = 0;
    for (let i = 0; i < 100; i++) if (d.detect(0.3, frame(i))) beats++;
    expect(beats).toBe(0);
  });

  it("does not fire below the silence floor", () => {
    const d = new BeatDetector({ floor: 0.05 });
    let beats = 0;
    for (let i = 0; i < 100; i++) {
      // tiny spikes but all under the floor
      const e = i % 10 === 0 ? 0.04 : 0.001;
      if (d.detect(e, frame(i))) beats++;
    }
    expect(beats).toBe(0);
  });

  it("fires on periodic spikes over a quiet baseline", () => {
    const d = new BeatDetector({ refractoryMs: 100 });
    const beatFrames: number[] = [];
    for (let i = 0; i < 120; i++) {
      const e = i % 20 === 0 && i > 0 ? 0.8 : 0.05; // a spike every 20 frames
      if (d.detect(e, frame(i))) beatFrames.push(i);
    }
    // spikes at 20,40,60,80,100 -> 5 beats
    expect(beatFrames.length).toBe(5);
    expect(beatFrames).toEqual([20, 40, 60, 80, 100]);
  });

  it("respects the refractory window (no double-trigger on adjacent spikes)", () => {
    const d = new BeatDetector({ refractoryMs: 250 });
    // build a quiet baseline first
    for (let i = 0; i < 20; i++) d.detect(0.05, frame(i));
    // two spikes only 1 frame (~17ms) apart -> second is within refractory
    const a = d.detect(0.9, frame(20));
    const b = d.detect(0.9, frame(21));
    expect(a).toBe(true);
    expect(b).toBe(false);
  });
});
