// Login API handler for Vercel
const { MongoClient, ObjectId } = require('mongodb');

// Helper function to connect to MongoDB
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  await client.connect();
  return client.db('maharashtra_tour_guide');
}

// Handle OPTIONS requests for CORS
function handleOptions(res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // End preflight request
  return res.status(200).end();
}

module.exports = async (req, res) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed - Only POST requests are accepted for login'
    });
  }
  
  try {
    // Get request body
    const { username, password, email } = req.body;
    
    // Check if required fields are provided
    if ((!username && !email) || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }
    
    // Connect to MongoDB
    const db = await connectToDatabase();
    
    // Find user
    let user = null;
    
    // First try to find by username if provided
    if (username) {
      user = await db.collection('users').findOne({ username });
    }
    
    // If no user found and email provided, try by email
    if (!user && email) {
      user = await db.collection('users').findOne({ email });
    }
    
    // Check if user was found
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Convert MongoDB _id to id and ensure it's a string
    const userId = user._id.toString();
    
    // Verify password
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Create response without password
    const { password: _, ...userWithoutPassword } = user;
    
    // Return user data in the format expected by client
    return res.status(200).json({
      ...userWithoutPassword,
      id: userId,
      _id: undefined
    });
    
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error", error: String(error) });
  }
}; 