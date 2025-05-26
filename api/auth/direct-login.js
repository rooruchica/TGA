// Direct login handler without any dependencies
module.exports = async function handler(req, res) {
  console.log('Direct-login endpoint called:', req.method, req.url);
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
    // Parse the body if it exists
    let username = "default_user";
    if (req.body) {
      console.log('Request has body object:', Object.keys(req.body));
      username = req.body.username || "default_user";
    } else {
      // Try to manually parse the body
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      // Check if we got any body data
      if (body) {
        try {
          console.log('Raw body:', body);
          const parsedBody = JSON.parse(body);
          console.log('Parsed body:', JSON.stringify(parsedBody));
          username = parsedBody.username || "default_user";
        } catch (err) {
          console.error('Failed to parse body:', err);
        }
      } else {
        console.log('No body content received');
      }
    }
    
    console.log('Using username for response:', username);
    
    // For testing purposes, just succeed for any login attempt
    return res.status(200).json({
      id: "direct123",
      username: username,
      email: `${username}@example.com`,
      fullName: `${username.charAt(0).toUpperCase() + username.slice(1)} Test`,
      userType: "tourist",
      createdAt: new Date().toISOString(),
      source: "direct-login"
    });
  } catch (error) {
    console.error("Direct login error:", error);
    return res.status(500).json({ 
      message: "Server error", 
      error: String(error),
      stack: error.stack
    });
  }
} 