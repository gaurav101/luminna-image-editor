import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/stylePresets.ts"),
      formats: ["es"],
      fileName: () => "stylePresets.js",
    },
  },
});
