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
    include: ["**/__tests__/**/*.test.ts"],
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
