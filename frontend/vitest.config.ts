// vitest.config.ts
//
// `server-only` is a guard package: it exports a module that throws unless the resolver is
// running under the "react-server" condition. Server modules here (lib/escrow.ts,
// lib/auth/siwe-session.ts) import it deliberately so they can never be pulled into a client
// bundle. Tests must therefore resolve the same way the server does — the same reason
// package.json runs the gate2 script with NODE_OPTIONS=--conditions=react-server.
//
// Aliasing `server-only` to a stub would also make the tests pass, and would be a lie: it
// would stop testing the module the server actually loads.

import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    conditions: ["react-server", "node", "import", "default"],
    alias: { "@": resolve(__dirname, ".") },
  },
  // Vitest transforms test modules through Vite's SSR pipeline, which resolves with its own
  // condition list — setting only the top-level one leaves `server-only` resolving to the
  // throwing build.
  ssr: {
    resolve: {
      conditions: ["react-server", "node", "import", "default"],
      externalConditions: ["react-server", "node", "import", "default"],
    },
  },
  test: {
    environment: "node",
    // app/** is here so route handlers are covered: a bug that only shows up when the handler
    // is called (wrong status, stale validation) is invisible to a test that reads source.
    include: ["lib/**/*.test.ts", "scripts/**/*.test.ts", "app/**/*.test.ts"],
  },
});
