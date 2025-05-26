// API health check
module.exports = async function handler(req, res) {
  console.log('API health check called:', req.method, req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Log environment variables (but not sensitive ones)
  const safeEnvVars = Object.keys(process.env)
    .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('PASS'))
    .reduce((obj, key) => {
      obj[key] = process.env[key] ? true : false; // Just log presence, not values
      return obj;
    }, {});
  
  console.log('Environment info:', {
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    envVarsPresent: safeEnvVars
  });
  
  return res.status(200).json({
    status: 'healthy',
    message: 'Maharashtra Tour Guide API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      '/api/auth/login': 'Primary authentication endpoint (MongoDB)',
      '/api/auth/mongo-login': 'Simplified authentication endpoint with hard-coded credentials',
      '/api/auth/direct-login': 'Test login endpoint (accepts any credentials)',
    },
    documentation: 'For more information, contact the developer'
  });
} 