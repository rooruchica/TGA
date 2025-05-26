// API endpoint that returns guide locations
module.exports = async (req, res) => {
  console.log('Guides locations API called:', req.method, req.url);
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
    // Return mock guide locations data
    const guides = [
      {
        userId: "guide1",
        username: "maharashtra_explorer",
        name: "Amol Deshmukh",
        latitude: 18.922,
        longitude: 72.8347, // Gateway of India
        lastUpdated: new Date().toISOString(),
        userType: 'guide'
      },
      {
        userId: "guide2",
        username: "pune_guide",
        name: "Priya Sharma",
        latitude: 18.5195,
        longitude: 73.8553, // Shaniwar Wada
        lastUpdated: new Date().toISOString(),
        userType: 'guide'
      },
      {
        userId: "guide3",
        username: "nagpur_tours",
        name: "Vijay Patil",
        latitude: 21.1458,
        longitude: 79.0882, // Nagpur
        lastUpdated: new Date().toISOString(),
        userType: 'guide'
      }
    ];
    
    return res.status(200).json(guides);
  } catch (error) {
    console.error("Error in guides/locations API:", error);
    return res.status(500).json({ 
      message: "Server error", 
      error: String(error)
    });
  }
}; 