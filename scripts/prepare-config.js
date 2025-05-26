import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Analyze project structure
const analyzeProjectStructure = () => {
  console.log('🔍 Analyzing project structure...');
  
  // Check if index.html exists in client folder
  const clientIndexPath = path.join(projectRoot, 'client', 'index.html');
  const rootIndexPath = path.join(projectRoot, 'index.html');
  
  let indexHtmlPath = null;
  if (fs.existsSync(clientIndexPath)) {
    indexHtmlPath = clientIndexPath;
    console.log('📄 Found index.html in client folder');
  } else if (fs.existsSync(rootIndexPath)) {
    indexHtmlPath = rootIndexPath;
    console.log('📄 Found index.html in project root');
  } else {
    console.log('⚠️ Could not find index.html');
  }
  
  // Analyze current vite.config.ts
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
  let originalConfig = null;
  if (fs.existsSync(viteConfigPath)) {
    try {
      originalConfig = fs.readFileSync(viteConfigPath, 'utf8');
      console.log('📄 Found vite.config.ts');
      
      // Try to extract root path from config
      const rootMatch = originalConfig.match(/root:\s*['"](.*?)['"]/);
      if (rootMatch && rootMatch[1]) {
        console.log(`📂 Detected root path in vite config: ${rootMatch[1]}`);
      }
      
      const rootPathVarMatch = originalConfig.match(/root:\s*path\.resolve\(.*?,\s*["'](.+?)["']/);
      if (rootPathVarMatch && rootPathVarMatch[1]) {
        console.log(`📂 Detected resolved root path: ${rootPathVarMatch[1]}`);
      }
    } catch (error) {
      console.log('⚠️ Could not read vite.config.ts');
    }
  }
  
  // Check for "type": "module" in package.json
  const packageJsonPath = path.join(projectRoot, 'package.json');
  let isESModule = false;
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      isESModule = packageJson.type === 'module';
      console.log(`📦 Package type: ${isESModule ? 'ES Module' : 'CommonJS'}`);
    } catch (error) {
      console.log('⚠️ Could not parse package.json');
    }
  }
  
  return {
    indexHtmlPath,
    originalConfig,
    isESModule
  };
};

// Path to the config files
const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
const clientDir = path.join(projectRoot, 'client');
const postcssConfigPath = path.join(projectRoot, 'postcss.config.js');
const clientPostcssConfigPath = path.join(clientDir, 'postcss.config.js');
const tailwindConfigPath = path.join(clientDir, 'tailwind.config.js');

// Path to our minimal vite config
const minimalViteConfigPath = path.join(__dirname, 'vite.config.minimal.js');

console.log('🔧 Preparing Render-compatible build configuration...');

// Check if we're running on Render
const isRender = process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID;

if (isRender) {
  console.log('📋 Running on Render, creating compatible config...');
  
  try {
    // Analyze the project structure first
    const { indexHtmlPath, originalConfig, isESModule } = analyzeProjectStructure();
    
    // Install required CSS dependencies globally to ensure they're available
    console.log('📦 Installing required CSS dependencies globally...');
    execSync('npm install -g autoprefixer postcss tailwindcss @tailwindcss/typography', { stdio: 'inherit' });
    console.log('📦 Installing required CSS dependencies locally...');
    execSync('npm install --save-dev autoprefixer postcss tailwindcss @tailwindcss/typography', { stdio: 'inherit' });
    
    // Backup the original vite config if it exists
    if (fs.existsSync(viteConfigPath)) {
      const configBackupPath = `${viteConfigPath}.original`;
      fs.copyFileSync(viteConfigPath, configBackupPath);
      console.log(`💾 Original vite config backed up to ${configBackupPath}`);
    }
    
    // Remove all CSS config files to avoid loading errors
    if (fs.existsSync(clientPostcssConfigPath)) {
      const postcssBackupPath = `${clientPostcssConfigPath}.original`;
      fs.copyFileSync(clientPostcssConfigPath, postcssBackupPath);
      console.log(`💾 Original client PostCSS config backed up to ${postcssBackupPath}`);
      
      // Remove the file so Vite doesn't try to load it
      fs.unlinkSync(clientPostcssConfigPath);
      console.log('🗑️ Removed client PostCSS config file');
    }
    
    if (fs.existsSync(postcssConfigPath)) {
      const postcssBackupPath = `${postcssConfigPath}.original`;
      fs.copyFileSync(postcssConfigPath, postcssBackupPath);
      console.log(`💾 Original root PostCSS config backed up to ${postcssBackupPath}`);
      
      // Remove the file so Vite doesn't try to load it
      fs.unlinkSync(postcssConfigPath);
      console.log('🗑️ Removed root PostCSS config file');
    }
    
    if (fs.existsSync(tailwindConfigPath)) {
      const tailwindBackupPath = `${tailwindConfigPath}.original`;
      fs.copyFileSync(tailwindConfigPath, tailwindBackupPath);
      console.log(`💾 Original Tailwind config backed up to ${tailwindBackupPath}`);
      
      // Remove the file
      fs.unlinkSync(tailwindConfigPath);
      console.log('🗑️ Removed Tailwind config file');
    }

    // Create a postcss.config.cjs file that works with ES modules
    console.log('📝 Creating ES module compatible PostCSS config...');
    const postcssConfigCjs = path.join(projectRoot, 'postcss.config.cjs');
    const postcssConfigContent = `// postcss.config.cjs - CommonJS format for compatibility
module.exports = {
  plugins: {
    // Empty plugins to avoid dependency issues
  }
};
`;
    fs.writeFileSync(postcssConfigCjs, postcssConfigContent);
    console.log('✅ Created PostCSS config in CommonJS format');

    // Create a minimal vite config with no CSS dependencies
    // Using information from our project structure analysis
    const minimalConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simplified vite config for Render deployment
export default defineConfig({
  plugins: [react()],
  css: {
    // Skip PostCSS processing entirely
    postcss: false,
    // Disable CSS modules to avoid preprocessor errors
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[local]'
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});`;
    
    fs.writeFileSync(viteConfigPath, minimalConfig);
    console.log('✅ Minimal Vite config created successfully!');
    
    // Create a simple index.html file if needed
    const indexHtml = path.join(projectRoot, 'index.html');
    if (!fs.existsSync(indexHtml)) {
      console.log('📝 Creating simple index.html in project root...');
      const simpleHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maharashtra Tour Guide</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/client/src/main.tsx"></script>
  </body>
</html>`;
      fs.writeFileSync(indexHtml, simpleHtml);
      console.log('✅ Created index.html in project root');
    }
    
  } catch (error) {
    console.error('❌ Error preparing Render configuration:', error);
    process.exit(1);
  }
} else {
  console.log('💻 Not running on Render, using standard configuration');
}

console.log('✨ Configuration preparation complete!'); 