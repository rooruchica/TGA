# Deployment Guide for Maharashtra Tour Guide Project

This guide explains how to deploy the Maharashtra Tour Guide application without modifying any code.

## Backend Deployment (Render)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub account and select the repository: https://github.com/rooruchica/TGA.git
4. Configure the service with these settings:
   - Name: maharashtra-tour-guide-backend
   - Environment: Node
   - Build Command: `yarn && yarn build`
   - Start Command: `NODE_ENV=production node dist/index.js`
   - Plan: Free

5. Add the following environment variables:
   - `MONGODB_URI`: `mongodb+srv://aaaaryaannn:r9J2T4WMCNMjmJGm@tga.ajmql56.mongodb.net/maharashtra_tour_guide?retryWrites=true&w=majority&appName=TGA`
   - `NODE_ENV`: `production`

6. Click "Create Web Service"

## Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository: https://github.com/rooruchica/TGA.git
4. Configure the project with these settings:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist/public`

5. Add the following environment variable:
   - `MONGODB_URI`: `mongodb+srv://aaaaryaannn:r9J2T4WMCNMjmJGm@tga.ajmql56.mongodb.net/maharashtra_tour_guide?retryWrites=true&w=majority&appName=TGA`

6. Click "Deploy"

## Connecting Frontend and Backend

After deployment, you'll need to connect your frontend to the backend API. Follow these steps:

1. Get the URL of your Render backend deployment (e.g., `https://maharashtra-tour-guide-backend.onrender.com`)
2. In your Vercel project, add a new environment variable:
   - `VITE_API_URL`: `https://maharashtra-tour-guide-backend.onrender.com`

3. Redeploy your Vercel frontend to apply the environment variable

## Important Notes

- Both deployments use the same MongoDB database
- No code modifications are required for the deployment to work
- The backend serves both the API and static files in development, but in production, the frontend will be served by Vercel
- Make sure your MongoDB cluster is accessible from both Render and Vercel (it should be by default) 