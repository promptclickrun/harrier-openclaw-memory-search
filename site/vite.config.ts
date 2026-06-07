import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages serves project sites under /<repo>/, so the build needs a
// matching base path. Override with BASE_PATH for custom domains or local
// preview (e.g. BASE_PATH=/ npm run build).
const base = process.env.BASE_PATH ?? "/harrier-openclaw-memory-search/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
