// API endpoint that returns tourist locations
module.exports = async (req, res) => {
  console.log('Tourists locations API called:', req.method, req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      message: 'Method not allowed - Only GET requests are accepted'
    });
  }
  
  try {
    // Return mock tourist locations data
    const tourists = [
      {
        userId: "tourist1",
        username: "traveler123",
        name: "John Singh",
        latitude: 18.9252,
        longitude: 72.8245, // Near Gateway of India
        lastUpdated: new Date().toISOString(),
        userType: 'tourist'
      },
      {
        userId: "tourist2",
        username: "worldexplorer",
        name: "Emma Patel",
        latitude: 18.5205,
        longitude: 73.8653, // Near Shaniwar Wada
        lastUpdated: new Date().toISOString(),
        userType: 'tourist'
      },
      {
        userId: "tourist3",
        username: "backpacker",
        name: "Alex Kumar",
        latitude: 19.076,
        longitude: 72.8777, // Mumbai
        lastUpdated: new Date().toISOString(),
        userType: 'tourist'
      }
    ];
    
    return res.status(200).json(tourists);
  } catch (error) {
    console.error("Error in tourists/locations API:", error);
    return res.status(500).json({ 
      message: "Server error", 
      error: String(error)
    });
  }
}; 