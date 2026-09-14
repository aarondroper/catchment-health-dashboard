import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  build: {
    // Public builds do not publish source maps; local debugging can use Vite's
    // development server and the checked-in source instead.
    sourcemap: false,
  },
});
