import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      "lumina-editor": resolve(__dirname, "../src/index.ts"),
      "lumina-editor/style-presets": resolve(__dirname, "../src/stylePresets.ts"),
    },
  },
  server: {
    port: 5174,
  },
});
