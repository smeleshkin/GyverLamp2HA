import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    outDir: "../custom_components/gyverlamp2/frontend",
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "gyverlamp2.js",
    },
    sourcemap: false,
    minify: true,
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
