#!/usr/bin/env node

// This is a CommonJS file to avoid module format conflicts
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();

console.log('🚀 Starting Render-compatible build process');

// Check for existing PostCSS config files
const postcssConfigPaths = [
  path.join(projectRoot, 'postcss.config.js'),
  path.join(projectRoot, 'client', 'postcss.config.js')
];

// Backup and remove any PostCSS config files
postcssConfigPaths.forEach(configPath => {
  if (fs.existsSync(configPath)) {
    console.log(`📋 Found PostCSS config at: ${configPath}`);
    const backupPath = `${configPath}.bak`;
    fs.copyFileSync(configPath, backupPath);
    console.log(`💾 Backed up to: ${backupPath}`);
    fs.unlinkSync(configPath);
    console.log(`🗑️ Removed original PostCSS config file`);
  }
});

// Create a CommonJS PostCSS config file
const cjsConfigPath = path.join(projectRoot, 'postcss.config.cjs');
const cjsConfigContent = `module.exports = {
  plugins: {}
};`;

fs.writeFileSync(cjsConfigPath, cjsConfigContent);
console.log(`📝 Created CommonJS PostCSS config at: ${cjsConfigPath}`);

// Create a Vite config that works with ES modules
const viteConfigPath = path.join(projectRoot, 'vite.config.js');
const viteConfigBackupPath = `${viteConfigPath}.backup`;

// Backup existing Vite config if it exists
if (fs.existsSync(viteConfigPath)) {
  fs.copyFileSync(viteConfigPath, viteConfigBackupPath);
  console.log(`💾 Backed up Vite config to: ${viteConfigBackupPath}`);
}

// Create a minimal Vite config that doesn't use PostCSS
const minimalViteConfig = `// Simple Vite config that avoids PostCSS
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: false,
    modules: {
      localsConvention: 'camelCase'
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  }
});`;

fs.writeFileSync(viteConfigPath, minimalViteConfig);
console.log(`📝 Created minimal Vite config at: ${viteConfigPath}`);

// Run the build
try {
  console.log('🏗️ Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('🏗️ Building backend...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Restore original configurations
  if (fs.existsSync(viteConfigBackupPath)) {
    fs.copyFileSync(viteConfigBackupPath, viteConfigPath);
    fs.unlinkSync(viteConfigBackupPath);
    console.log(`🔄 Restored original Vite config`);
  }
  
  // Clean up the CJS config
  if (fs.existsSync(cjsConfigPath)) {
    fs.unlinkSync(cjsConfigPath);
    console.log(`🧹 Cleaned up temporary files`);
  }
} 