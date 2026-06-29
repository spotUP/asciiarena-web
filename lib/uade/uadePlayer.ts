// Thin browser wrapper around the UADE AudioWorklet player (ported from DEViLBOX).
//
// The player is three same-origin assets under /uade/: the worklet processor
// (UADE.worklet.js, registered as "uade-processor"), the Emscripten glue
// (UADE.js), and the WASM binary (UADE.wasm). The worklet speaks a small message
// protocol; this wrapper drives it and exposes a minimal play/analyser surface.
// It is a singleton: one AudioContext + engine for the whole site, so music
// keeps playing across navigation.

export interface UadeTrackMeta {
  player: string;
  formatName: string;
  subsongCount: number;
}

type SongEndCb = () => void;

// The DEViLBOX transform that makes the Emscripten glue runnable inside the
// worklet with an injected wasm binary.
function uadeTransform(code: string): string {
  return code
    .replace(/import\.meta\.url/g, "'.'")
    .replace(/export\s+default\s+\w+;?/g, "")
    .replace(/var\s+wasmBinary;/, 'var wasmBinary = Module["wasmBinary"];');
}

const TOTAL_OUTPUTS = 37; // [0] = main stereo mix; [1..36] unused dub/isolation sends

class UadePlayer {
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private gain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private initPromise: Promise<void> | null = null;
  private resolveInit: (() => void) | null = null;
  private resolveLoad: ((m: UadeTrackMeta) => void) | null = null;
  private rejectLoad: ((e: Error) => void) | null = null;
  private songEndCbs = new Set<SongEndCb>();
  private _volume = 0.7;

  /** Lazily create the AudioContext + worklet and run the WASM init handshake. */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const ctx = new AudioContext();
      this.ctx = ctx;
      await ctx.audioWorklet.addModule("/uade/UADE.worklet.js");

      const [wasmBinary, jsRaw] = await Promise.all([
        fetch("/uade/UADE.wasm").then((r) => r.arrayBuffer()),
        fetch("/uade/UADE.js").then((r) => r.text()),
      ]);
      const jsCode = uadeTransform(jsRaw);

      const node = new AudioWorkletNode(ctx, "uade-processor", {
        numberOfOutputs: TOTAL_OUTPUTS,
        outputChannelCount: new Array(TOTAL_OUTPUTS).fill(2),
      });
      this.node = node;

      const gain = ctx.createGain();
      gain.gain.value = this._volume;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      this.gain = gain;
      this.analyser = analyser;
      // output 0 (main mix) -> gain -> analyser -> speakers
      node.connect(gain, 0);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      node.port.onmessage = (e) => this.onMessage(e.data);
      node.onprocessorerror = () => {
        try { node.disconnect(); } catch { /* */ }
      };

      const ready = new Promise<void>((resolve) => { this.resolveInit = resolve; });
      node.port.postMessage(
        { type: "init", sampleRate: ctx.sampleRate, wasmBinary, jsCode },
        [wasmBinary],
      );
      await ready;
    })();
    return this.initPromise;
  }

  private onMessage(data: { type: string; [k: string]: unknown }): void {
    switch (data.type) {
      case "ready":
        this.resolveInit?.();
        this.resolveInit = null;
        break;
      case "loaded":
        this.resolveLoad?.({
          player: (data.player as string) ?? "Unknown",
          formatName: (data.formatName as string) ?? "Unknown",
          subsongCount: (data.subsongCount as number) ?? 1,
        });
        this.resolveLoad = null;
        this.rejectLoad = null;
        break;
      case "songEnd":
        for (const cb of this.songEndCbs) cb();
        break;
      case "error":
        this.rejectLoad?.(new Error((data.message as string) ?? "UADE error"));
        this.resolveLoad = null;
        this.rejectLoad = null;
        break;
    }
  }

  /** Resume the context (must be called from a user gesture before playback). */
  async resume(): Promise<void> {
    await this.ctx?.resume();
  }

  /** Register a companion file (e.g. TFMX smpl.*) before load(). */
  async addCompanionFile(filename: string, data: ArrayBuffer): Promise<void> {
    await this.init();
    const buf = data.slice(0);
    this.node!.port.postMessage({ type: "addCompanionFile", filename, buffer: buf }, [buf]);
  }

  /** Load a module for playback only (skips the heavy pattern scan). */
  async load(data: ArrayBuffer, filenameHint: string, subsong = 0): Promise<UadeTrackMeta> {
    await this.init();
    const buf = data.slice(0);
    const loaded = new Promise<UadeTrackMeta>((resolve, reject) => {
      this.resolveLoad = resolve;
      this.rejectLoad = reject;
    });
    this.node!.port.postMessage(
      { type: "load", buffer: buf, filenameHint, skipScan: true, subsong },
      [buf],
    );
    return loaded;
  }

  play(): void {
    void this.resume();
    this.node?.port.postMessage({ type: "play" });
  }
  pause(): void {
    this.node?.port.postMessage({ type: "pause" });
  }
  stop(): void {
    this.node?.port.postMessage({ type: "stop" });
  }
  setLooping(value: boolean): void {
    this.node?.port.postMessage({ type: "setLooping", value });
  }
  setSubsong(index: number): void {
    this.node?.port.postMessage({ type: "setSubsong", index });
  }

  get volume(): number {
    return this._volume;
  }
  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.gain) this.gain.gain.value = this._volume;
  }

  onSongEnd(cb: SongEndCb): () => void {
    this.songEndCbs.add(cb);
    return () => this.songEndCbs.delete(cb);
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
}

let singleton: UadePlayer | null = null;

/** The site-wide UADE player instance (created on first use, browser only). */
export function getUadePlayer(): UadePlayer {
  if (!singleton) singleton = new UadePlayer();
  return singleton;
}

export type { UadePlayer };
