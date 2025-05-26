import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// This is a simplified vite config for Render deployment
// It removes Replit-specific plugins that cause build failures
export default defineConfig({
  plugins: [
    react(),
    // Replit-specific plugins removed for Render compatibility
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
}); 