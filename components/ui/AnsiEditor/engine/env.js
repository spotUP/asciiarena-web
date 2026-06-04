/**
 * Engine environment config — replaces text0wnz's Vite import.meta.env reads.
 *
 * Fonts and assets are served from public/ansi-editor/ in this Next.js project.
 * The collab worker is disabled in phase 1 (workerPath left empty).
 *
 * @type {{ urlPrefix: string, uiDir: string, fontDir: string, workerPath: string }}
 */
export const ENGINE_ENV = {
  urlPrefix: "",
  uiDir: "/ansi-editor/",
  fontDir: "/ansi-editor/fonts/",
  workerPath: "", // collab worker disabled in phase 1
};
