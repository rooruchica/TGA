// API proxy for Vercel deployment
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const { parse } = require('url');

// Configure CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Determine if we need to proxy to a local server in dev or use the same origin in production
const target = process.env.NODE_ENV === 'production' 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:5000';

// Proxy middleware options
const apiProxy = createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
});

app.use('/api', apiProxy);

// Export the Express app as a serverless function
module.exports = (req, res) => {
  const parsedUrl = parse(req.url, true);
  req.query = parsedUrl.query;
  
  return app(req, res);
}; 