import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Path to the vite config
const viteConfigPath = path.join(projectRoot, 'vite.config.ts');

console.log('🔧 Preparing Render-compatible build configuration...');

// Check if we're running on Render
const isRender = process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID;

if (isRender) {
  console.log('📋 Running on Render, creating compatible config...');
  
  try {
    // Backup the original config if it exists
    if (fs.existsSync(viteConfigPath)) {
      const configBackupPath = `${viteConfigPath}.original`;
      fs.copyFileSync(viteConfigPath, configBackupPath);
      console.log(`💾 Original config backed up to ${configBackupPath}`);
    }
    
    // Create a simplified config that works on Render
    const renderCompatibleConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simplified vite config for Render deployment
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});`;
    
    // Write the new config
    fs.writeFileSync(viteConfigPath, renderCompatibleConfig);
    console.log('✅ Render-compatible config created successfully!');
    
  } catch (error) {
    console.error('❌ Error preparing Render configuration:', error);
    process.exit(1);
  }
} else {
  console.log('💻 Not running on Render, using standard configuration');
}

console.log('✨ Configuration preparation complete!'); 