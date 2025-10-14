import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/layout/index.ts",
    "src/primitives/index.ts",
    "src/components/index.ts",
    "src/theme/index.ts",
    "src/styles/index.css",
    "src/styles/globals.css",
    "src/styles/tokens.css"
  ],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom", "tailwindcss"],
  banner: {
    js: "'use client';",
  },
});

