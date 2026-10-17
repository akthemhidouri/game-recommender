// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Backend (FastAPI) address used by the dev server proxy.
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export default defineConfig({
  integrations: [react()],
  output: "static",
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { "@": "/src", "@components": "/src/components" },
    },
    server: {
      proxy: {
        // Browser calls /api/games  ->  FastAPI receives /games
        "/api": {
          target: BACKEND,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target: BACKEND,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  },
});
