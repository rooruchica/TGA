#!/bin/bash

# Configure npm to use a custom directory for global packages
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Install all dependencies including vite globally
npm install
npm install -g vite
npm install -g esbuild

# Run the build command
npm run build 