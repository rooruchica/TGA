import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Path to the config files
const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
const clientDir = path.join(projectRoot, 'client');
const postcssConfigPath = path.join(clientDir, 'postcss.config.js');
const tailwindConfigPath = path.join(clientDir, 'tailwind.config.js');

// Path to our backup tailwind config
const backupTailwindConfigPath = path.join(__dirname, 'tailwind.config.js');

console.log('🔧 Preparing Render-compatible build configuration...');

// Check if we're running on Render
const isRender = process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID;

if (isRender) {
  console.log('📋 Running on Render, creating compatible config...');
  
  try {
    // Install required CSS dependencies
    console.log('📦 Installing required CSS dependencies...');
    execSync('npm install --no-save autoprefixer postcss tailwindcss @tailwindcss/typography', { stdio: 'inherit' });
    
    // Backup the original vite config if it exists
    if (fs.existsSync(viteConfigPath)) {
      const configBackupPath = `${viteConfigPath}.original`;
      fs.copyFileSync(viteConfigPath, configBackupPath);
      console.log(`💾 Original vite config backed up to ${configBackupPath}`);
    }
    
    // Create a simplified PostCSS config
    console.log('🎨 Creating simplified PostCSS config...');
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}`;
    
    // Backup and update PostCSS config
    if (fs.existsSync(postcssConfigPath)) {
      const postcssBackupPath = `${postcssConfigPath}.original`;
      fs.copyFileSync(postcssConfigPath, postcssBackupPath);
      console.log(`💾 Original PostCSS config backed up to ${postcssBackupPath}`);
    }
    fs.writeFileSync(postcssConfigPath, postcssConfig);
    console.log('✅ Render-compatible PostCSS config created successfully!');
    
    // Copy our simplified tailwind config
    console.log('🎨 Setting up Tailwind CSS configuration...');
    if (fs.existsSync(tailwindConfigPath)) {
      const tailwindBackupPath = `${tailwindConfigPath}.original`;
      fs.copyFileSync(tailwindConfigPath, tailwindBackupPath);
      console.log(`💾 Original Tailwind config backed up to ${tailwindBackupPath}`);
    }
    if (fs.existsSync(backupTailwindConfigPath)) {
      fs.copyFileSync(backupTailwindConfigPath, tailwindConfigPath);
      console.log('✅ Render-compatible Tailwind config copied successfully!');
    } else {
      // Create a basic tailwind config
      const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}`;
      fs.writeFileSync(tailwindConfigPath, tailwindConfig);
      console.log('✅ Render-compatible Tailwind config created successfully!');
    }
    
    // Create a simplified vite config
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
    
    // Write the new vite config
    fs.writeFileSync(viteConfigPath, renderCompatibleConfig);
    console.log('✅ Render-compatible vite config created successfully!');
    
  } catch (error) {
    console.error('❌ Error preparing Render configuration:', error);
    process.exit(1);
  }
} else {
  console.log('💻 Not running on Render, using standard configuration');
}

console.log('✨ Configuration preparation complete!'); 