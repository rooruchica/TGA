import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Find likely entry points
const possibleEntries = [
  path.join(projectRoot, 'client/src/main.tsx'),
  path.join(projectRoot, 'client/src/main.jsx'),
  path.join(projectRoot, 'client/src/main.ts'),
  path.join(projectRoot, 'client/src/main.js'),
  path.join(projectRoot, 'client/src/index.tsx'),
  path.join(projectRoot, 'client/src/index.jsx'),
  path.join(projectRoot, 'client/src/index.ts'),
  path.join(projectRoot, 'client/src/index.js'),
  path.join(projectRoot, 'src/main.tsx'),
  path.join(projectRoot, 'src/main.jsx'),
  path.join(projectRoot, 'src/main.ts'),
  path.join(projectRoot, 'src/main.js'),
  path.join(projectRoot, 'src/index.tsx'),
  path.join(projectRoot, 'src/index.jsx'),
  path.join(projectRoot, 'src/index.ts'),
  path.join(projectRoot, 'src/index.js')
];

console.log('🔍 Checking for entry point file...');

let entryFound = false;
for (const entry of possibleEntries) {
  if (fs.existsSync(entry)) {
    console.log(`✅ Found entry point at: ${entry}`);
    entryFound = true;
    break;
  }
}

if (!entryFound) {
  // Create a minimal entry point
  console.log('⚠️ No entry point found, creating one...');
  
  // Create directories if they don't exist
  const entryDir = path.join(projectRoot, 'client/src');
  if (!fs.existsSync(entryDir)) {
    fs.mkdirSync(entryDir, { recursive: true });
  }
  
  const entryPath = path.join(entryDir, 'main.tsx');
  const entryContent = `import React from 'react';
import ReactDOM from 'react-dom/client';

// Simple App component
function App() {
  return (
    <div className="app">
      <h1>Maharashtra Tour Guide</h1>
      <p>Your application is running but was built with a simplified config for Render deployment.</p>
    </div>
  );
}

// Render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  
  fs.writeFileSync(entryPath, entryContent);
  console.log(`✅ Created entry point at: ${entryPath}`);
}

// Ensure client and src directories exist
const dirs = [
  path.join(projectRoot, 'client'),
  path.join(projectRoot, 'client/src')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

console.log('✨ Entry point check complete!'); 