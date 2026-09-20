import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Next.js ESM interop — vitest resolves bare `next/server` as CJS
      "next/server": path.resolve(__dirname, "node_modules/next/server.js"),
      "next/headers": path.resolve(__dirname, "node_modules/next/headers.js"),
      "next/navigation": path.resolve(__dirname, "node_modules/next/navigation.js"),
    },
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // .tsx too: a control that loses what you typed can only be caught by
    // mounting it and driving real events at it. Source-shape assertions pass
    // happily on a combobox that drops its value.
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    server: {
      deps: {
        // Let Next.js and NextAuth be treated as external CJS modules
        external: ["next", "next-auth", "@auth"],
      },
    },
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/api/**"],
    },
  },
});
