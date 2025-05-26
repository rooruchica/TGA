// vite.direct.js - Direct Vite configuration for Render
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Check for entry point file
let entryPoint = '/index.html';
try {
  const files = ['index.html', 'client/index.html'];
  for (const file of files) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      entryPoint = '/' + file;
      console.log(`Using entry point: ${entryPoint}`);
      break;
    }
  }
} catch (error) {
  console.error(`Error finding entry point: ${error.message}`);
}

// Ultra minimal Vite config with no dependencies on external packages
export default defineConfig({
  configFile: false,
  plugins: [react()],
  // Completely disable all CSS processing
  css: false,
  root: projectRoot,
  publicDir: path.resolve(projectRoot, 'public'),
  build: {
    outDir: path.resolve(projectRoot, 'dist/public'),
    emptyOutDir: true,
    // Skip all non-essential processing
    cssCodeSplit: false,
    minify: 'esbuild',
    cssMinify: false,
    sourcemap: false,
    manifest: false,
    ssrManifest: false,
    reportCompressedSize: false,
    // Minimize Vite processing
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: path.resolve(projectRoot, entryPoint.substring(1))
      }
    }
  }
}); 