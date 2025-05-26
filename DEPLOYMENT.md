# Deployment Guide for Maharashtra Tour Guide Project

This guide explains how to deploy the Maharashtra Tour Guide application without modifying any code.

## Testing Locally First

Before deploying, it's recommended to test the application locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```
   The server should start at http://localhost:5000

3. Verify the build process:
   ```
   npm run build
   ```
   This should create a `dist` folder with both client and server builds.

4. Test the production build:
   ```
   $env:NODE_ENV="production"; node dist/index.js  # For Windows PowerShell
   # OR
   NODE_ENV=production node dist/index.js  # For Linux/Mac
   ```
   The server should start at http://localhost:5000

## Backend Deployment (Render)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub account and select the repository: https://github.com/rooruchica/TGA.git
4. Configure the service with these settings:
   - Name: maharashtra-tour-guide-backend
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `NODE_ENV=production node dist/index.js`
   - Plan: Free

5. Add the following environment variables:
   - `MONGODB_URI`: `mongodb+srv://aaaaryaannn:r9J2T4WMCNMjmJGm@tga.ajmql56.mongodb.net/maharashtra_tour_guide?retryWrites=true&w=majority&appName=TGA`
   - `NODE_ENV`: `production`

6. Click "Create Web Service"

## Frontend Deployment (Vercel)

For this application, we'll actually deploy a single backend service on Render that includes both the API and static frontend files. This approach maintains the application structure without code changes.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository: https://github.com/rooruchica/TGA.git
4. Configure the project with these settings:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist/public`

5. Under "Environment Variables", add:
   - `MONGODB_URI`: `mongodb+srv://aaaaryaannn:r9J2T4WMCNMjmJGm@tga.ajmql56.mongodb.net/maharashtra_tour_guide?retryWrites=true&w=majority&appName=TGA`

6. Click "Deploy"

## Important Notes

- The application is designed to serve both the backend API and frontend from the same server
- If you're deploying to both Render and Vercel, you'll need to update API endpoint references in the frontend code to point to your Render backend
- Both deployments use the same MongoDB database
- No code modifications are required for the deployment to work
- Make sure your MongoDB cluster is accessible from both Render and Vercel (it should be by default)

## Troubleshooting

If your deployment fails, check the following:

1. Verify that the MongoDB connection is working (check connection string and network access)
2. Check the build logs for any errors
3. Make sure all environment variables are set correctly
4. If you encounter CORS issues, ensure your production domain is properly configured in your API routes 