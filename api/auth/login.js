// Login API handler for Vercel
const { MongoClient, ObjectId } = require('mongodb');

// Helper function to connect to MongoDB
async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Environment variables:', Object.keys(process.env).join(', '));
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    if (!uri) {
      console.warn('MONGODB_URI environment variable is not set');
      return null;
    }
    
    console.log('Attempting to connect to MongoDB at:', uri.substring(0, 20) + '...');
    
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await client.connect();
    console.log('Connected to MongoDB');
    return {
      client,
      db: client.db('maharashtra_tour_guide')
    };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return null;
  }
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

// Parse request body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        console.error('Error parsing request body:', error);
        resolve({});
      }
    });
  });
}

// Fallback login for when MongoDB is unavailable
function getFallbackUser(username) {
  console.log('Using fallback login for:', username);
  return {
    id: "user123",
    username: username || "default_user",
    email: `${username || "user"}@example.com`,
    fullName: username ? `${username.charAt(0).toUpperCase() + username.slice(1)} Test` : "Test User",
    userType: "tourist",
    createdAt: new Date().toISOString()
  };
}

module.exports = async (req, res) => {
  console.log('Login request received:', req.method, req.url);
  console.log('Request headers:', JSON.stringify(req.headers));
  
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
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  let connection;
  
  try {
    // Parse request body manually
    const body = await parseBody(req);
    console.log('Request body:', JSON.stringify(body));
    
    const { username, password, email } = body;
    
    console.log('Login attempt for:', { username, email });
    
    // Check if required fields are provided
    if ((!username && !email) || !password) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }
    
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    connection = await connectToDatabase();
    console.log('MongoDB connection result:', !!connection);
    
    // If MongoDB connection failed, use fallback login
    if (!connection) {
      console.warn('MongoDB connection failed, using fallback login');
      return res.status(200).json(getFallbackUser(username || email?.split('@')[0]));
    }
    
    const { db, client } = connection;
    
    // Find user
    let user = null;
    
    // First try to find by username if provided
    if (username) {
      console.log('Looking up user by username:', username);
      user = await db.collection('users').findOne({ username });
      console.log('User found by username:', !!user);
    }
    
    // If no user found and email provided, try by email
    if (!user && email) {
      console.log('Looking up user by email:', email);
      user = await db.collection('users').findOne({ email });
      console.log('User found by email:', !!user);
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
    
    console.log('Login successful for user:', username || email);
    
    // Return user data in the format expected by client
    return res.status(200).json({
      ...userWithoutPassword,
      id: userId,
      _id: undefined
    });
    
  } catch (error) {
    console.error("Login error:", error);
    
    // Return fallback user as last resort
    try {
      const body = await parseBody(req);
      return res.status(200).json(getFallbackUser(body.username || body.email?.split('@')[0]));
    } catch (fallbackError) {
      return res.status(500).json({ 
        message: "Server error", 
        error: String(error),
        fallbackError: String(fallbackError),
        note: "Both primary login and fallback failed"
      });
    }
  } finally {
    // Close MongoDB connection if it was opened
    if (connection && connection.client) {
      try {
        await connection.client.close();
        console.log('MongoDB connection closed');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
      }
    }
  }
}; 