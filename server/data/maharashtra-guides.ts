import { InsertUser, InsertGuideProfile } from "@shared/schema";

export const maharashtraGuides: {
  user: InsertUser;
  profile: InsertGuideProfile;
}[] = [
  {
    user: {
      username: "aditya_guide",
      password: "password123",
      fullName: "Aditya Deshmukh",
      email: "aditya.guide@example.com",
      phone: "+91 9876543201",
      userType: "guide"
    },
    profile: {
      userId: 0, // Will be replaced with actual user ID after creation
      location: "Mumbai, Maharashtra",
      experience: 7,
      languages: ["English", "Hindi", "Marathi"],
      specialties: ["Historical Sites", "Cultural Tours", "Street Food"],
      rating: 5,
      bio: "Mumbai native with extensive knowledge of the city's history and hidden gems."
    }
  },
  {
    user: {
      username: "priya_guide",
      password: "password123",
      fullName: "Priya Patil",
      email: "priya.guide@example.com",
      phone: "+91 9876543202",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Pune, Maharashtra",
      experience: 5,
      languages: ["English", "Hindi", "Marathi"],
      specialties: ["Historical Forts", "Local Cuisine", "Art Galleries"],
      rating: 4,
      bio: "Passionate about Pune's rich history and cultural heritage. Expert in fort treks."
    }
  },
  {
    user: {
      username: "raj_guide",
      password: "password123",
      fullName: "Raj Jadhav",
      email: "raj.guide@example.com",
      phone: "+91 9876543203",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Aurangabad, Maharashtra",
      experience: 8,
      languages: ["English", "Hindi", "Marathi", "Urdu"],
      specialties: ["Ajanta Caves", "Ellora Caves", "Historical Monuments"],
      rating: 5,
      bio: "Expert in Ajanta and Ellora caves with deep knowledge of Buddhist, Hindu, and Jain art and architecture."
    }
  },
  {
    user: {
      username: "sunita_guide",
      password: "password123",
      fullName: "Sunita Sharma",
      email: "sunita.guide@example.com",
      phone: "+91 9876543204",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Nashik, Maharashtra",
      experience: 4,
      languages: ["English", "Hindi", "Marathi"],
      specialties: ["Vineyards", "Religious Tours", "Trekking"],
      rating: 4,
      bio: "Wine enthusiast and expert in Nashik's vineyards. Also conducts religious tours to Trimbakeshwar."
    }
  },
  {
    user: {
      username: "vivek_guide",
      password: "password123",
      fullName: "Vivek Kulkarni",
      email: "vivek.guide@example.com",
      phone: "+91 9876543205",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Kolhapur, Maharashtra",
      experience: 6,
      languages: ["English", "Hindi", "Marathi", "Kannada"],
      specialties: ["Mahalaxmi Temple", "Local Cuisine", "Cultural Tours"],
      rating: 5,
      bio: "Born and raised in Kolhapur with deep knowledge of the region's temples, cuisine, and traditions."
    }
  },
  {
    user: {
      username: "ananya_guide",
      password: "password123",
      fullName: "Ananya Gokhale",
      email: "ananya.guide@example.com",
      phone: "+91 9876543206",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Lonavala, Maharashtra",
      experience: 3,
      languages: ["English", "Hindi", "Marathi"],
      specialties: ["Trekking", "Nature Tours", "Adventure Sports"],
      rating: 4,
      bio: "Adventure enthusiast specializing in trekking and outdoor activities in the Western Ghats."
    }
  },
  {
    user: {
      username: "nikhil_guide",
      password: "password123",
      fullName: "Nikhil Joshi",
      email: "nikhil.guide@example.com",
      phone: "+91 9876543207",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Alibaug, Maharashtra",
      experience: 5,
      languages: ["English", "Hindi", "Marathi"],
      specialties: ["Beach Activities", "Water Sports", "Historical Forts"],
      rating: 4,
      bio: "Coastal expert offering tours to Alibaug's beaches, forts, and water sports activities."
    }
  },
  {
    user: {
      username: "meera_guide",
      password: "password123",
      fullName: "Meera Dixit",
      email: "meera.guide@example.com",
      phone: "+91 9876543208",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Mahabaleshwar, Maharashtra",
      experience: 4,
      languages: ["English", "Hindi", "Marathi"],
      specialties: ["Strawberry Farms", "Scenic Points", "Nature Trails"],
      rating: 5,
      bio: "Nature lover with comprehensive knowledge of Mahabaleshwar's viewpoints and strawberry farms."
    }
  },
  {
    user: {
      username: "sanjay_guide",
      password: "password123",
      fullName: "Sanjay Pawar",
      email: "sanjay.guide@example.com",
      phone: "+91 9876543209",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Ratnagiri, Maharashtra",
      experience: 7,
      languages: ["English", "Hindi", "Marathi", "Konkani"],
      specialties: ["Beaches", "Seafood Cuisine", "Historical Sites"],
      rating: 4,
      bio: "Konkan expert specializing in coastal Maharashtra's beaches, cuisine, and historical sites."
    }
  },
  {
    user: {
      username: "ritu_guide",
      password: "password123",
      fullName: "Ritu Patel",
      email: "ritu.guide@example.com",
      phone: "+91 9876543210",
      userType: "guide"
    },
    profile: {
      userId: 0,
      location: "Shirdi, Maharashtra",
      experience: 6,
      languages: ["English", "Hindi", "Marathi", "Gujarati"],
      specialties: ["Religious Tours", "Cultural Experience", "Local History"],
      rating: 5,
      bio: "Spiritual guide with deep knowledge about Sai Baba and the religious significance of Shirdi."
    }
  }
];