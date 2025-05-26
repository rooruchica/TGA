#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Reminder about Auth0 configuration
echo ""
echo "IMPORTANT: Remember to configure Auth0 in client/src/lib/auth0.ts with your credentials"
echo "You'll need to set up a free Auth0 account and configure SMS passwordless authentication"
echo ""

# Run the development server
echo "Starting development server..."
npm run dev 