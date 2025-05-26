// render-build.js - Script to run build process on Render
import { execSync } from 'child_process';

console.log('Starting build process for Render deployment...');

try {
  // Run the Vite build using npx to ensure we use the local installation
  console.log('Running Vite build...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Run esbuild for the server
  console.log('Building server with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit' 
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 