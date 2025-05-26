// render-setup.js - This script modifies package.json for Render deployment
import fs from 'fs';

console.log('Setting up package.json for Render deployment...');

try {
  // Read the existing package.json
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  // Add vite and esbuild to dependencies if they're in devDependencies
  if (packageJson.devDependencies.vite && !packageJson.dependencies.vite) {
    packageJson.dependencies.vite = packageJson.devDependencies.vite;
    console.log('Added vite to dependencies');
  }
  
  if (packageJson.devDependencies.esbuild && !packageJson.dependencies.esbuild) {
    packageJson.dependencies.esbuild = packageJson.devDependencies.esbuild;
    console.log('Added esbuild to dependencies');
  }
  
  // Create a temporary package.json for deployment
  fs.writeFileSync('./package.json.render', JSON.stringify(packageJson, null, 2));
  console.log('Created package.json.render for deployment');
  
  console.log('Setup completed successfully!');
} catch (error) {
  console.error('Setup failed:', error);
} 