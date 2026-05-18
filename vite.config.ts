import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src",
      include: ["src/index.ts", "src/components/LuminaEditor.tsx", "src/stylePresets.ts"],
      insertTypesEntry: true,
    }),
  ],
  server: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "LuminaEditor",
      formats: ["es", "umd"],
      fileName: (fmt) => `lumina-editor.${fmt}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@gks101/luminajs"],
      output: {
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime",
          "@gks101/luminajs": "LuminaJS",
        },
      },
    },
  },
});
