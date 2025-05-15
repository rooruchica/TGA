// API health check
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    status: 'healthy',
    message: 'Maharashtra Tour Guide API is running',
    version: '1.0.0',
    endpoints: {
      '/api/auth/login': 'Authentication endpoint',
      '/api/auth/direct-login': 'Simplified login endpoint for testing',
    },
    documentation: 'For more information, contact the developer'
  });
} 