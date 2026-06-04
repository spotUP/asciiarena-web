import type { TextArtCanvas } from "./engine-types";

/**
 * The mutable State singleton. Callers assign `palette` and `textArtCanvas`
 * during initialisation (see mount.ts).
 */
export interface EngineState {
  palette: unknown;
  textArtCanvas: TextArtCanvas | null;
  font: unknown;
}

declare const State: EngineState;

export { State };
export default State;
