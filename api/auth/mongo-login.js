// Simple login handler for Vercel without MongoDB dependencies
module.exports = async (req, res) => {
  console.log('Mongo-login endpoint called:', req.method, req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ 
      message: 'Method not allowed - Only POST requests are accepted for login'
    });
  }
  
  try {
    // Parse request body manually
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    const loginData = await new Promise((resolve) => {
      req.on('end', () => {
        try {
          console.log('Request body raw:', body);
          const parsedData = JSON.parse(body);
          console.log('Parsed body:', JSON.stringify(parsedData));
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing request body:', error);
          resolve({});
        }
      });
    });
    
    const { username, password } = loginData;
    
    console.log('Login attempt for:', username);
    
    // Hard-coded test user for the demo
    // In production, you would validate against a database
    if (username === 'aryan' && password === 'password123') {
      console.log('Login successful for test user');
      
      // Return user data
      return res.status(200).json({
        id: "user123",
        username: "aryan",
        email: "aryan@example.com",
        fullName: "Aryan Test",
        userType: "tourist",
        createdAt: new Date().toISOString()
      });
    }
    
    // For guide login
    if (username === 'guide' && password === 'guide123') {
      console.log('Login successful for test guide');
      
      // Return guide data
      return res.status(200).json({
        id: "guide123",
        username: "guide",
        email: "guide@example.com",
        fullName: "Test Guide",
        userType: "guide",
        createdAt: new Date().toISOString(),
        currentLatitude: "18.92",
        currentLongitude: "72.83"
      });
    }
    
    // For debugging - accept any login in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('DEBUG MODE: Auto-login accepted for any credentials');
      return res.status(200).json({
        id: "debug123",
        username: username || "debug_user",
        email: `${username || "debug"}@example.com`,
        fullName: username ? `${username.charAt(0).toUpperCase() + username.slice(1)} Debug` : "Debug User",
        userType: "tourist",
        createdAt: new Date().toISOString()
      });
    }
    
    // Invalid credentials
    console.log('Login failed: Invalid credentials');
    return res.status(401).json({ 
      message: "Invalid credentials",
      note: "This is a demo API that accepts username 'aryan' with password 'password123' or 'guide' with password 'guide123'"
    });
    
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      message: "Server error", 
      error: String(error),
      stack: error.stack
    });
  }
}; 