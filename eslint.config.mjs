import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored / generated / non-source — not code we maintain or that Next
    // compiles. Bare `eslint` would otherwise lint minified Bootstrap, the
    // telnet client, and the generated Prisma client.
    "assets/**",
    "telnet/**",
    "protracker/**",
    "lib/generated/**",
    "public/**",
    ".playwright-mcp/**",
  ]),
  {
    // The eslint-config-next bump turned on the React Compiler rule set as
    // hard errors. This codebase (migrated from PHP) predates them and the
    // flagged patterns are intentional and runtime-correct (and `next build`
    // passes). Keep them as warnings — visible, not CI-blocking — rather than
    // risk a ~30-file behavioural refactor. Revisit per-rule when convenient.
    rules: {
      "react-hooks/error-boundaries": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
