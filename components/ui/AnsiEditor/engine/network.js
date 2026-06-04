/**
 * network.js — no-op stub for the embedded asciiarena ANSI editor.
 *
 * The upstream text0wnz `network.js` wires the editor into a collaborative
 * WebSocket session (worker handler + chat controller). asciiarena embeds the
 * editor in single-user mode only, so collaboration is intentionally stubbed
 * out here. Real-time collaboration is a separate, later sub-project.
 *
 * The shapes below match exactly what `bootstrap.js` (the trimmed `main.js`)
 * consumes:
 *   - createWorkerHandler(...) -> object with optional send* methods that
 *     bootstrap calls via `State.network?.sendX?.(...)` (optional chaining, so
 *     they may be absent — but we provide harmless no-ops for clarity).
 *   - createChatController(...) -> object with `isEnabled()` (boolean getter)
 *     and `toggle()`, passed to createSettingToggle.
 */

/**
 * @returns {{
 *   sendResize: () => void,
 *   sendIceColorsChange: () => void,
 *   sendLetterSpacingChange: () => void,
 *   sendFontChange: () => void,
 *   postMessage: () => void,
 *   terminate: () => void,
 * }}
 */
export function createWorkerHandler() {
	return {
		// Called UN-chained by the engine (state.js auto-save, ui.js input
		// gating). Single-user embed is never connected to a collab session.
		isConnected() {
			return false;
		},
		sendResize() {},
		sendIceColorsChange() {},
		sendLetterSpacingChange() {},
		sendFontChange() {},
		postMessage() {},
		terminate() {},
	};
}

/**
 * @returns {{ isEnabled: () => boolean, toggle: () => void }}
 */
export function createChatController() {
	return {
		isEnabled() {
			return false;
		},
		toggle() {},
	};
}
