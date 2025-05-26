# Maharashtra Tourism App

A comprehensive mobile application for Maharashtra tourism that connects tourists with local guides and provides various features for exploring the region.

## Features

- Interactive maps for location discovery
- Hotel and transport bookings
- Tourist attractions exploration
- Itinerary planning
- Guide connections and management
- User authentication (login/registration)

## Getting Started

To run this Expo project on your local machine, follow these steps:

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- Expo Go app on your physical device (optional, for testing)

### Installation

1. Clone or download this repository to your local machine

2. Create a new `package.json` file in the root directory with the following content:
```json
{
  "name": "maharashtra-tourism-app",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "expo": "~50.0.4",
    "expo-status-bar": "~1.11.1",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "react-native-maps": "1.8.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.1.3"
  },
  "private": true
}
```

3. Create a new `app.json` file in the root directory with the following content:
```json
{
  "expo": {
    "name": "Maharashtra Tourism",
    "slug": "maharashtra-tourism",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF6B00"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FF6B00"
      }
    }
  }
}
```

4. Create assets folder and add placeholder images:
   - Create `assets/icon.png` (1024x1024 PNG)
   - Create `assets/splash.png` (1242x2436 PNG)
   - Create `assets/adaptive-icon.png` (1024x1024 PNG)
   - Convert SVG assets to PNG as needed for `guide-placeholder.png`, `place-placeholder.png`, and `welcome-bg.png`

5. Navigate to the project directory and install dependencies:
```bash
npm install
```

6. Start the development server:
```bash
npm start
```

7. Use the Expo Go app to scan the QR code displayed in the terminal, or run on an emulator by pressing 'a' for Android.

## Project Structure

- `/screens` - All application screens
- `/assets` - Images, icons, and other assets
- `App.js` - Main entry point and navigation setup

## API Integration

The app is designed to use Geoapify for map and location services (API key: 1b6a6068e8704c89813a9c10591c4881).

## Built With

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)