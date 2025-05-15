import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Find the index.html file by checking common locations
let indexHtmlPath = path.resolve(projectRoot, 'client', 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  indexHtmlPath = path.resolve(projectRoot, 'index.html');
}

// Most minimal configuration possible with no external dependencies
export default defineConfig({
  plugins: [react()],
  css: {
    // Skip PostCSS processing entirely
    postcss: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client", "src"),
      "@shared": path.resolve(projectRoot, "shared"),
      "@assets": path.resolve(projectRoot, "attached_assets"),
    },
  },
  root: projectRoot, // Use project root instead of client dir
  build: {
    outDir: path.resolve(projectRoot, "dist/public"),
    emptyOutDir: true,
  },
}); 