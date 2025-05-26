const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory where we'll create a simplified preview app
const previewDir = path.join(__dirname, 'expo-preview');

// Create the preview directory
if (!fs.existsSync(previewDir)) {
  fs.mkdirSync(previewDir);
}

// Create a simple React app to preview the screens
const indexContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

const appContent = `
import React, { useState } from 'react';
import './App.css';

// Importing screen previews
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import BookingsScreen from './screens/BookingsScreen';
import ConnectionsScreen from './screens/ConnectionsScreen';
import TripPlannerScreen from './screens/TripPlannerScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'search':
        return <SearchScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'bookings':
        return <BookingsScreen />;
      case 'connections':
        return <ConnectionsScreen />;
      case 'tripPlanner':
        return <TripPlannerScreen />;
      case 'welcome':
        return <WelcomeScreen onNavigate={setCurrentScreen} />;
      case 'login':
        return <LoginScreen onNavigate={setCurrentScreen} />;
      case 'register':
        return <RegisterScreen onNavigate={setCurrentScreen} />;
      default:
        return <WelcomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="App">
      <div className="screenContainer">
        <div className="phoneFrame">
          <div className="screen">
            {renderScreen()}
          </div>
        </div>
      </div>
      <div className="navigationPanel">
        <button onClick={() => setCurrentScreen('welcome')}>Welcome</button>
        <button onClick={() => setCurrentScreen('login')}>Login</button>
        <button onClick={() => setCurrentScreen('register')}>Register</button>
        <button onClick={() => setCurrentScreen('home')}>Home</button>
        <button onClick={() => setCurrentScreen('search')}>Search</button>
        <button onClick={() => setCurrentScreen('tripPlanner')}>Trip Planner</button>
        <button onClick={() => setCurrentScreen('bookings')}>Bookings</button>
        <button onClick={() => setCurrentScreen('connections')}>Connections</button>
        <button onClick={() => setCurrentScreen('profile')}>Profile</button>
      </div>
    </div>
  );
}

export default App;
`;

const indexCssContent = `
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`;

const appCssContent = `
.App {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
}

.screenContainer {
  margin-bottom: 20px;
}

.phoneFrame {
  width: 375px;
  height: 812px;
  background-color: #111;
  border-radius: 40px;
  padding: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
}

.screen {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 30px;
  overflow: hidden;
}

.navigationPanel {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 15px;
  background-color: #FF6B00;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background-color: #FF8533;
}
`;

// Create the necessary folders
const srcDir = path.join(previewDir, 'src');
const screensDir = path.join(srcDir, 'screens');

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir);
}

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir);
}

// Write the basic app structure
fs.writeFileSync(path.join(srcDir, 'index.js'), indexContent);
fs.writeFileSync(path.join(srcDir, 'App.js'), appContent);
fs.writeFileSync(path.join(srcDir, 'index.css'), indexCssContent);
fs.writeFileSync(path.join(srcDir, 'App.css'), appCssContent);

// Create a simple package.json
const packageJsonContent = `
{
  "name": "expo-preview",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
`;

fs.writeFileSync(path.join(previewDir, 'package.json'), packageJsonContent);

// Create a simple HTML file
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Maharashtra Tourism App Preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const publicDir = path.join(previewDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}
fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);

// Create screen preview components
const createScreenPreview = (name, contentFn) => {
  const screenContent = contentFn();
  fs.writeFileSync(path.join(screensDir, `${name}.js`), screenContent);
};

// Example of creating a Welcome screen preview 
createScreenPreview('WelcomeScreen', () => `
import React from 'react';

function WelcomeScreen({ onNavigate }) {
  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(to bottom, #FF6B00, #FF8533)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '24px',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '10px' }}>⛰️</div>
        <h2 style={{ margin: '8px 0' }}>Maharashtra Tourism</h2>
      </div>
      
      <div style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Discover the Beauty of Maharashtra</h1>
        <p style={{ fontSize: '16px', opacity: '0.8' }}>
          Explore historical sites, beautiful beaches, majestic mountains, and vibrant culture
        </p>
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <button
          onClick={() => onNavigate('login')}
          style={{
            width: '100%',
            padding: '16px',
            background: '#FF6B00',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            marginBottom: '16px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
        
        <button
          onClick={() => onNavigate('register')}
          style={{
            width: '100%',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid white',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            marginBottom: '16px',
            cursor: 'pointer'
          }}
        >
          Register
        </button>
        
        <button
          onClick={() => onNavigate('home')}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '16px',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
`);

createScreenPreview('HomeScreen', () => `
import React from 'react';

function HomeScreen() {
  return (
    <div style={{ height: '100%', padding: '16px', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Good Morning</p>
          <h2 style={{ fontSize: '22px', margin: '0' }}>Explore Maharashtra</h2>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          👤
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', background: '#f0f0f0', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
        <span style={{ marginRight: '8px' }}>🔍</span>
        <span style={{ color: '#666' }}>Search destinations, hotels...</span>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Categories</h3>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '24px', paddingBottom: '8px' }}>
          {['Beaches', 'Mountains', 'Temples', 'Forts', 'Wildlife'].map((cat, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'rgba(255, 107, 0, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px', color: '#FF6B00' }}>
                {index === 0 ? '🏖️' : index === 1 ? '⛰️' : index === 2 ? '🛕' : index === 3 ? '🏰' : '🐯'}
              </div>
              <span style={{ fontSize: '14px', textAlign: 'center' }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', margin: '0' }}>Featured Places</h3>
          <span style={{ color: '#FF6B00', fontSize: '14px' }}>See All</span>
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px' }}>
          {['Gateway of India', 'Ajanta Caves', 'Ellora Caves'].map((place, index) => (
            <div key={index} style={{ minWidth: '250px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ height: '150px', background: '#f0f0f0', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ color: '#bbb', fontSize: '40px' }}>🖼️</span>
              </div>
              <div style={{ padding: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0' }}>{place}</h4>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#FF6B00', marginRight: '4px' }}>📍</span>
                  <span style={{ fontSize: '14px', color: '#666' }}>{index === 0 ? 'Mumbai' : 'Aurangabad'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', margin: '0' }}>Available Guides</h3>
          <span style={{ color: '#FF6B00', fontSize: '14px' }}>See All</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Rahul Sharma', 'Priya Patel'].map((guide, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: '#f0f0f0', marginRight: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ color: '#bbb' }}>👤</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0' }}>{guide}</h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>{index === 0 ? 'Mumbai History' : 'Caves & Architecture'}</p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#FFD700', marginRight: '4px' }}>⭐</span>
                  <span style={{ fontSize: '14px' }}>{index === 0 ? '4.8' : '4.9'}</span>
                </div>
              </div>
              <button style={{ background: '#FF6B00', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }}>
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
`);

createScreenPreview('SearchScreen', () => `
import React from 'react';

function SearchScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '22px', margin: '0 0 16px 0' }}>Discover Places</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', background: '#f0f0f0', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
          <span style={{ marginRight: '8px' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search locations, attractions..." 
            style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '16px', outline: 'none' }}
          />
        </div>
        
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '16px' }}>
          {['Attractions', 'Hotels', 'Restaurants', 'Medical', 'ATMs', 'Shopping'].map((cat, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '8px 12px', 
              background: index === 0 ? '#FF6B00' : 'rgba(255, 107, 0, 0.1)', 
              borderRadius: '20px',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ 
                marginRight: '6px',
                color: index === 0 ? 'white' : '#FF6B00'
              }}>
                {index === 0 ? '⭐' : index === 1 ? '🏨' : index === 2 ? '🍽️' : index === 3 ? '🏥' : index === 4 ? '💰' : '🛍️'}
              </span>
              <span style={{ 
                fontSize: '14px',
                color: index === 0 ? 'white' : '#FF6B00'
              }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ height: '220px', background: '#f0f0f0', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: '#aaa' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🗺️</div>
          <div>Map View</div>
        </div>
      </div>
      
      <div style={{ padding: '0 16px', flex: 1, overflow: 'auto' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Nearby Places</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { name: 'Gateway of India', address: 'Apollo Bandar, Colaba, Mumbai', distance: '1.2 km' },
            { name: 'Taj Mahal Palace Hotel', address: 'Apollo Bandar, Colaba, Mumbai', distance: '1.3 km' },
            { name: 'Leopold Cafe', address: 'Colaba Causeway, Mumbai', distance: '1.5 km' }
          ].map((place, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px', 
              background: '#f8f8f8', 
              borderRadius: '12px'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '20px', 
                background: 'rgba(255, 107, 0, 0.1)', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginRight: '12px',
                color: '#FF6B00'
              }}>
                {index === 0 ? '⭐' : index === 1 ? '🏨' : '🍽️'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '16px' }}>{place.name}</h4>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>{place.address}</p>
              </div>
              <div style={{ 
                background: '#e8e8e8', 
                padding: '4px 8px', 
                borderRadius: '12px', 
                fontSize: '12px', 
                color: '#666' 
              }}>
                {place.distance}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchScreen;
`);

createScreenPreview('LoginScreen', () => `
import React from 'react';

function LoginScreen({ onNavigate }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button 
          onClick={() => onNavigate('welcome')}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '8px' }}
        >
          ←
        </button>
      </div>
      
      <div style={{ marginTop: '20px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome Back</h1>
        <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>Login to your account to continue</p>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Username</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#666', marginRight: '8px' }}>👤</span>
            <input 
              type="text" 
              placeholder="Enter your username" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Password</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#666', marginRight: '8px' }}>🔒</span>
            <input 
              type="password" 
              placeholder="Enter your password" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
            />
            <span style={{ color: '#666', cursor: 'pointer' }}>👁️</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            color: '#FF6B00', 
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Forgot Password?
          </button>
        </div>
        
        <button 
          onClick={() => onNavigate('home')}
          style={{ 
            width: '100%', 
            background: '#FF6B00', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            padding: '16px', 
            fontSize: '16px', 
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '24px'
          }}
        >
          Login
        </button>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '24px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
          <span style={{ padding: '0 8px', color: '#666', fontSize: '14px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
        </div>
        
        <button style={{ 
          width: '100%', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '12px', 
          padding: '16px', 
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          <span style={{ marginRight: '8px' }}>G</span>
          <span>Continue with Google</span>
        </button>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '24px'
      }}>
        <span style={{ fontSize: '16px', color: '#666' }}>Don't have an account?</span>
        <button 
          onClick={() => onNavigate('register')}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#FF6B00',
            marginLeft: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default LoginScreen;
`);

// Create additional screen previews for other screens
createScreenPreview('RegisterScreen', () => `
import React from 'react';

function RegisterScreen({ onNavigate }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button 
          onClick={() => onNavigate('welcome')}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '8px' }}
        >
          ←
        </button>
      </div>
      
      <div style={{ marginTop: '20px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Create Account</h1>
        <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>Join us and explore Maharashtra</p>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Full Name</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#666', marginRight: '8px' }}>👤</span>
            <input 
              type="text" 
              placeholder="Enter your full name" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#666', marginRight: '8px' }}>✉️</span>
            <input 
              type="email" 
              placeholder="Enter your email" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Phone Number</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#666', marginRight: '8px' }}>📱</span>
            <input 
              type="tel" 
              placeholder="Enter your phone number" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Password</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#666', marginRight: '8px' }}>🔒</span>
            <input 
              type="password" 
              placeholder="Create a password" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
            />
            <span style={{ color: '#666', cursor: 'pointer' }}>👁️</span>
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Confirm Password</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#666', marginRight: '8px' }}>🔒</span>
            <input 
              type="password" 
              placeholder="Confirm your password" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginVertical: '24px' }}>
          <span style={{ color: '#FF6B00', marginRight: '8px' }}>☑️</span>
          <span style={{ fontSize: '14px', color: '#666' }}>
            I agree to the <span style={{ color: '#FF6B00', fontWeight: '500' }}>Terms of Service</span> and <span style={{ color: '#FF6B00', fontWeight: '500' }}>Privacy Policy</span>
          </span>
        </div>
        
        <button 
          onClick={() => onNavigate('home')}
          style={{ 
            width: '100%', 
            background: '#FF6B00', 
            color: 'white', 
            border: 'none', 
            borderRadius: '12px', 
            padding: '16px', 
            fontSize: '16px', 
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Create Account
        </button>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '24px'
      }}>
        <span style={{ fontSize: '16px', color: '#666' }}>Already have an account?</span>
        <button 
          onClick={() => onNavigate('login')}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#FF6B00',
            marginLeft: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default RegisterScreen;
`);

createScreenPreview('ProfileScreen', () => `
import React from 'react';

function ProfileScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '22px', margin: '0' }}>Profile</h2>
        <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✏️</button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingVertical: '20px' }}>
        <div style={{ 
          width: '100px', 
          height: '100px', 
          borderRadius: '50px', 
          background: '#f0f0f0', 
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '40px',
          color: '#ddd'
        }}>
          👤
        </div>
        <h3 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Aryan Varma</h3>
        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 20px 0' }}>aryan.varma@example.com</p>
        
        <div style={{ 
          display: 'flex', 
          width: 'calc(100% - 32px)', 
          background: '#f8f8f8', 
          borderRadius: '12px', 
          padding: '16px',
          margin: '0 16px'
        }}>
          <div style={{ flex: 1, alignItems: 'center', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>12</p>
            <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>Trips</p>
          </div>
          <div style={{ width: '1px', background: '#e0e0e0' }}></div>
          <div style={{ flex: 1, alignItems: 'center', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>24</p>
            <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>Saved</p>
          </div>
          <div style={{ width: '1px', background: '#e0e0e0' }}></div>
          <div style={{ flex: 1, alignItems: 'center', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>8</p>
            <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>Guides</p>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0 16px' }}>
        <div style={{ 
          background: '#FFF4EE', 
          borderRadius: '12px', 
          padding: '16px', 
          display: 'flex', 
          alignItems: 'center',
          borderWidth: '1px',
          borderColor: 'rgba(255, 107, 0, 0.2)',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '40px', color: '#FF6B00', marginRight: '12px' }}>👔</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>Share your local expertise</h4>
            <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>Become a guide and earn by showing tourists around Maharashtra</p>
          </div>
          <button style={{ 
            background: '#FF6B00', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            Apply
          </button>
        </div>
        
        <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>My Account</h3>
        
        {[
          { icon: '📍', title: 'Saved Places', subtitle: 'View your saved locations' },
          { icon: '📖', title: 'Trip History', subtitle: 'View past trips' },
          { icon: '💳', title: 'Payments & Refunds', subtitle: 'Manage your payment methods' },
        ].map((item, index) => (
          <div key={index} style={{ 
            display: 'flex',
            alignItems: 'center',
            paddingVertical: '16px',
            borderBottomWidth: '1px',
            borderBottomColor: '#f0f0f0'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: '12px'
            }}>
              <span style={{ fontSize: '20px', color: '#FF6B00' }}>{item.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '16px', margin: '0' }}>{item.title}</p>
              <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>{item.subtitle}</p>
            </div>
            <span style={{ color: '#ccc' }}>▶️</span>
          </div>
        ))}
        
        <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '12px' }}>Settings</h3>
        
        {[
          { icon: '🔔', title: 'Notifications', toggle: true },
          { icon: '📍', title: 'Location Services', toggle: true },
          { icon: '🌐', title: 'Language', subtitle: 'English', toggle: false },
          { icon: '🔒', title: 'Privacy & Security', toggle: false },
        ].map((item, index) => (
          <div key={index} style={{ 
            display: 'flex',
            alignItems: 'center',
            paddingVertical: '16px',
            borderBottomWidth: '1px',
            borderBottomColor: '#f0f0f0'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: '12px'
            }}>
              <span style={{ fontSize: '20px', color: '#FF6B00' }}>{item.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '16px', margin: '0' }}>{item.title}</p>
              {item.subtitle && <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>{item.subtitle}</p>}
            </div>
            {item.toggle ? (
              <div style={{ 
                width: '40px', 
                height: '20px', 
                backgroundColor: '#FFCCA9', 
                borderRadius: '10px',
                position: 'relative'
              }}>
                <div style={{ 
                  width: '18px', 
                  height: '18px', 
                  backgroundColor: '#FF6B00', 
                  borderRadius: '9px',
                  position: 'absolute',
                  right: '1px',
                  top: '1px'
                }} />
              </div>
            ) : (
              <span style={{ color: '#ccc' }}>▶️</span>
            )}
          </div>
        ))}
        
        <button style={{ 
          width: '100%', 
          marginTop: '36px',
          marginBottom: '40px',
          background: '#FFEDED', 
          color: '#F44336',
          border: 'none',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          <span style={{ marginRight: '8px' }}>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default ProfileScreen;
`);

createScreenPreview('BookingsScreen', () => `
import React from 'react';

function BookingsScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '22px', margin: '0 0 16px 0' }}>My Bookings</h2>
        
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '16px' }}>
          {['All', 'Hotels', 'Transport', 'Guides'].map((tab, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 16px', 
              background: index === 0 ? '#FF6B00' : '#f0f0f0', 
              borderRadius: '20px',
              whiteSpace: 'nowrap'
            }}>
              {index !== 0 && (
                <span style={{ 
                  marginRight: '4px',
                  color: index === 1 ? '#666' : index === 2 ? '#666' : '#666'
                }}>
                  {index === 1 ? '🏨' : index === 2 ? '🚌' : '👤'}
                </span>
              )}
              <span style={{ 
                fontSize: '14px',
                fontWeight: '500',
                color: index === 0 ? 'white' : '#666'
              }}>{tab}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '0 16px', overflow: 'auto' }}>
        {[
          { 
            type: 'hotel', 
            name: 'Taj Mahal Palace', 
            location: 'Mumbai', 
            date: '12 Apr - 15 Apr, 2025', 
            status: 'confirmed', 
            price: '₹34,500'
          },
          { 
            type: 'transport', 
            mode: 'Bus', 
            from: 'Mumbai', 
            to: 'Pune', 
            date: '11 Apr, 2025', 
            time: '10:30 AM', 
            status: 'upcoming', 
            price: '₹800'
          },
          { 
            type: 'guide', 
            name: 'Rahul Sharma', 
            location: 'Ajanta Caves', 
            date: '15 Apr, 2025', 
            time: '9:00 AM - 2:00 PM', 
            status: 'pending', 
            price: '₹2,500'
          },
        ].map((booking, index) => (
          <div key={index} style={{ 
            marginBottom: '16px',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              height: '140px', 
              background: '#f0f0f0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#bbb',
              fontSize: '40px'
            }}>
              {booking.type === 'hotel' ? '🏨' : booking.type === 'transport' ? '🚌' : '👤'}
            </div>
            
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    {booking.type === 'hotel' && booking.name}
                    {booking.type === 'transport' && `${booking.mode}: ${booking.from} - ${booking.to}`}
                    {booking.type === 'guide' && `Guide: ${booking.name}`}
                  </h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                    {booking.type === 'hotel' && booking.location}
                    {booking.type === 'transport' && `${booking.date}, ${booking.time}`}
                    {booking.type === 'guide' && `${booking.location}, ${booking.date}`}
                  </p>
                </div>
                
                <div style={{ 
                  background: 
                    booking.status === 'confirmed' ? 'rgba(76, 175, 80, 0.1)' : 
                    booking.status === 'upcoming' ? 'rgba(33, 150, 243, 0.1)' : 
                    'rgba(255, 193, 7, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '12px'
                }}>
                  <span style={{ 
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 
                      booking.status === 'confirmed' ? '#4CAF50' : 
                      booking.status === 'upcoming' ? '#2196F3' : 
                      '#FFC107'
                  }}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: '16px'
                }}>
                  <span style={{ 
                    color: '#666',
                    marginRight: '4px'
                  }}>
                    {booking.type === 'hotel' ? '📅' : '⏰'}
                  </span>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {booking.type === 'hotel' ? booking.date : booking.time}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    color: '#666',
                    marginRight: '4px'
                  }}>
                    💰
                  </span>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {booking.price}
                  </span>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex',
                justifyContent: 'flex-end',
                borderTopWidth: '1px',
                borderTopColor: '#eee',
                paddingTop: '12px'
              }}>
                {booking.status !== 'cancelled' && (
                  <button style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    marginRight: '16px',
                    padding: '0',
                    cursor: 'pointer'
                  }}>
                    <span style={{ color: '#FF6B00', marginRight: '4px', fontSize: '16px' }}>✏️</span>
                    <span style={{ color: '#FF6B00', fontWeight: '500', fontSize: '14px' }}>Modify</span>
                  </button>
                )}
                
                {booking.status !== 'cancelled' && (
                  <button style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    marginRight: '16px',
                    padding: '0',
                    cursor: 'pointer'
                  }}>
                    <span style={{ color: '#F44336', marginRight: '4px', fontSize: '16px' }}>❌</span>
                    <span style={{ color: '#F44336', fontWeight: '500', fontSize: '14px' }}>Cancel</span>
                  </button>
                )}
                
                <button style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer'
                }}>
                  <span style={{ color: '#2196F3', marginRight: '4px', fontSize: '16px' }}>🎟️</span>
                  <span style={{ color: '#2196F3', fontWeight: '500', fontSize: '14px' }}>Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <div style={{ height: '40px' }}></div>
      </div>
    </div>
  );
}

export default BookingsScreen;
`);

createScreenPreview('ConnectionsScreen', () => `
import React from 'react';

function ConnectionsScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '22px', margin: '0' }}>My Connections</h2>
        <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>🔍</button>
      </div>
      
      <div style={{ display: 'flex', overflowX: 'auto', borderBottomWidth: '1px', borderBottomColor: '#eee' }}>
        <div style={{ padding: '0 16px' }}>
          {['All', 'Accepted', 'Pending', 'Rejected'].map((tab, index) => (
            <div key={index} style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '12px 16px', 
              background: index === 0 ? '#FF6B00' : '#f0f0f0', 
              borderRadius: '20px',
              marginRight: '8px'
            }}>
              {index !== 0 && (
                <span style={{ 
                  marginRight: '4px',
                  color: index === 0 ? 'white' : 
                         index === 1 ? '#4CAF50' : 
                         index === 2 ? '#FFC107' : 
                         '#F44336'
                }}>
                  {index === 1 ? '✓' : index === 2 ? '⏱️' : '✗'}
                </span>
              )}
              <span style={{ 
                fontSize: '14px',
                fontWeight: '500',
                color: index === 0 ? 'white' : '#666'
              }}>{tab}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        {[
          { 
            id: 1, 
            name: 'Rahul Sharma', 
            expertise: 'Mumbai Historical Sites', 
            location: 'Mumbai', 
            rating: 4.8, 
            price: '₹2500/day', 
            languages: ['English', 'Hindi', 'Marathi'], 
            status: 'accepted'
          },
          { 
            id: 2, 
            name: 'Priya Patel', 
            expertise: 'Cave Architecture & History', 
            location: 'Aurangabad', 
            rating: 4.9, 
            price: '₹3000/day', 
            languages: ['English', 'Hindi', 'Gujarati'], 
            status: 'pending'
          },
          { 
            id: 3, 
            name: 'Amit Joshi', 
            expertise: 'Wildlife & Nature Tours', 
            location: 'Tadoba', 
            rating: 4.7, 
            price: '₹2800/day', 
            languages: ['English', 'Hindi', 'Marathi'], 
            status: 'rejected'
          },
        ].map((guide, index) => (
          <div key={index} style={{ 
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '60px',
                height: '60px',
                borderRadius: '30px',
                background: '#f0f0f0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#ddd',
                fontSize: '24px'
              }}>
                👤
              </div>
              
              <div style={{ flex: 1, marginLeft: '12px' }}>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 'bold' }}>{guide.name}</h3>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>{guide.expertise}</p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#FFD700', marginRight: '4px' }}>⭐</span>
                  <span style={{ fontSize: '14px' }}>{guide.rating}</span>
                </div>
              </div>
              
              <div style={{ 
                background: 
                  guide.status === 'accepted' ? 'rgba(76, 175, 80, 0.1)' : 
                  guide.status === 'pending' ? 'rgba(255, 193, 7, 0.1)' : 
                  'rgba(244, 67, 54, 0.1)',
                padding: '4px 10px',
                borderRadius: '12px'
              }}>
                <span style={{ 
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 
                    guide.status === 'accepted' ? '#4CAF50' : 
                    guide.status === 'pending' ? '#FFC107' : 
                    '#F44336'
                }}>
                  {guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div style={{ height: '1px', background: '#eee', margin: '12px 0' }}></div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#666', marginRight: '8px' }}>📍</span>
                <span style={{ fontSize: '14px', color: '#666' }}>{guide.location}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#666', marginRight: '8px' }}>💰</span>
                <span style={{ fontSize: '14px', color: '#666' }}>{guide.price}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#666', marginRight: '8px' }}>🌐</span>
                <span style={{ fontSize: '14px', color: '#666' }}>{guide.languages.join(', ')}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {guide.status === 'accepted' && (
                <button style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FF6B00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginLeft: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  <span style={{ marginRight: '4px' }}>💬</span>
                  <span>Message</span>
                </button>
              )}
              
              <button style={{ 
                display: 'flex',
                alignItems: 'center',
                background: 
                  guide.status === 'pending' ? '#f0f0f0' : 
                  guide.status === 'rejected' ? '#FFF4EE' : 
                  '#4CAF50',
                color: 
                  guide.status === 'pending' ? '#666' : 
                  'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                marginLeft: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                <span style={{ marginRight: '4px' }}>
                  {guide.status === 'accepted' ? '📞' : 
                   guide.status === 'pending' ? '⏱️' : 
                   '🔄'}
                </span>
                <span>
                  {guide.status === 'accepted' ? 'Contact' : 
                   guide.status === 'pending' ? 'Pending' : 
                   'Request Again'}
                </span>
              </button>
              
              {guide.status === 'accepted' && (
                <button style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFB74D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginLeft: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  <span style={{ marginRight: '4px' }}>📅</span>
                  <span>Book</span>
                </button>
              )}
            </div>
          </div>
        ))}
        
        <div style={{ height: '80px' }}></div>
      </div>
      
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        right: '20px',
        background: '#FF6B00',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        paddingHorizontal: '20px',
        paddingVertical: '12px',
        borderRadius: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <span style={{ marginRight: '8px', fontSize: '24px' }}>🔍</span>
        <span style={{ fontWeight: 'bold' }}>Find Guides</span>
      </div>
    </div>
  );
}

export default ConnectionsScreen;
`);

createScreenPreview('TripPlannerScreen', () => `
import React from 'react';

function TripPlannerScreen() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '22px', margin: '0 0 16px 0' }}>Plan Your Trip</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>From</p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#FF6B00', marginRight: '8px' }}>📍</span>
            <input 
              type="text" 
              placeholder="Origin city" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
              value="Mumbai"
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>To</p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#FF6B00', marginRight: '8px' }}>📍</span>
            <input 
              type="text" 
              placeholder="Destination city" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
              value="Aurangabad"
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ width: '48%' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Departure Date</p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              border: '1px solid #ddd', 
              borderRadius: '12px', 
              padding: '0 12px',
              height: '50px'
            }}>
              <span style={{ color: '#FF6B00', marginRight: '8px' }}>📅</span>
              <input 
                type="text" 
                placeholder="DD/MM/YYYY" 
                style={{ 
                  border: 'none', 
                  fontSize: '16px', 
                  outline: 'none',
                  width: '100%',
                  height: '100%'
                }} 
                value="15/04/2025"
              />
            </div>
          </div>
          
          <div style={{ width: '48%' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Return Date</p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              border: '1px solid #ddd', 
              borderRadius: '12px', 
              padding: '0 12px',
              height: '50px'
            }}>
              <span style={{ color: '#FF6B00', marginRight: '8px' }}>📅</span>
              <input 
                type="text" 
                placeholder="DD/MM/YYYY" 
                style={{ 
                  border: 'none', 
                  fontSize: '16px', 
                  outline: 'none',
                  width: '100%',
                  height: '100%'
                }} 
                value="18/04/2025"
              />
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Travelers</p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid #ddd', 
            borderRadius: '12px', 
            padding: '0 12px',
            height: '50px'
          }}>
            <span style={{ color: '#FF6B00', marginRight: '8px' }}>👥</span>
            <input 
              type="text" 
              placeholder="Number of travelers" 
              style={{ 
                border: 'none', 
                fontSize: '16px', 
                outline: 'none',
                width: '100%',
                height: '100%'
              }} 
              value="2"
            />
          </div>
        </div>
        
        <div style={{ marginVertical: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Your Route</h3>
          <div style={{ 
            height: '200px', 
            borderRadius: '12px', 
            background: '#f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#aaa'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🗺️</div>
              <div>Map View</div>
            </div>
          </div>
        </div>
        
        <div style={{ marginVertical: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Suggested Itineraries</h3>
          
          <div style={{ 
            background: '#f8f8f8',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>3-Day Adventure</h4>
              <div style={{ 
                background: '#FF6B00',
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>Popular</span>
              </div>
            </div>
            
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 12px 0' }}>
              Explore the best attractions between Mumbai and Aurangabad in 3 days.
            </p>
            
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                <span style={{ color: '#666', marginRight: '4px' }}>📍</span>
                <span style={{ fontSize: '14px', color: '#666' }}>5 Places</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#666', marginRight: '4px' }}>⏱️</span>
                <span style={{ fontSize: '14px', color: '#666' }}>3 Days</span>
              </div>
            </div>
          </div>
          
          <div style={{ 
            background: '#f8f8f8',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>Weekend Getaway</h4>
              <div style={{ 
                background: '#FF6B00',
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>Quick</span>
              </div>
            </div>
            
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 12px 0' }}>
              Perfect weekend trip between Mumbai and Aurangabad with essential stops.
            </p>
            
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                <span style={{ color: '#666', marginRight: '4px' }}>📍</span>
                <span style={{ fontSize: '14px', color: '#666' }}>3 Places</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#666', marginRight: '4px' }}>⏱️</span>
                <span style={{ fontSize: '14px', color: '#666' }}>2 Days</span>
              </div>
            </div>
          </div>
        </div>
        
        <button style={{ 
          width: '100%',
          background: '#FF6B00',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '16px',
          marginTop: '24px',
          marginBottom: '40px',
          cursor: 'pointer'
        }}>
          <span>Plan My Trip</span>
          <span style={{ marginLeft: '8px' }}>→</span>
        </button>
      </div>
    </div>
  );
}

export default TripPlannerScreen;
`);

console.log('Created screen preview components');

// Run the preview app
console.log('The app preview code has been created! Please navigate to expo-preview/ and run: npm start');