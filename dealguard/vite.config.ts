import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Capacitor serves the built bundle from the app sandbox (capacitor:// on iOS,
// https://localhost on Android), so asset URLs must stay relative.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
});
