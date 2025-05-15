// Direct login handler without any dependencies
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed - Only POST requests are accepted for login'
    });
  }
  
  try {
    // For testing purposes, just succeed for any login attempt
    return res.status(200).json({
      id: "user123",
      username: "aryan",
      email: "aryan@example.com",
      fullName: "Aryan Test",
      userType: "tourist",
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      message: "Server error", 
      error: String(error)
    });
  }
} 