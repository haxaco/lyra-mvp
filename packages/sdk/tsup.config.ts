import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom", "@tanstack/react-query"],
  banner: {
    js: "'use client';",
  },
});

