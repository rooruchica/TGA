import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Import screens
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import TripPlannerScreen from './screens/TripPlannerScreen';
import BookingsScreen from './screens/BookingsScreen';
import ConnectionsScreen from './screens/ConnectionsScreen';
import ProfileScreen from './screens/ProfileScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Main tab navigator for the app
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF6B00',
        tabBarStyle: { height: 60 },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 8 },
        headerShown: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="magnify" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="Trip"
        component={TripPlannerScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="map-marker-path" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bookmark" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="Guides"
        component={ConnectionsScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-tie" size={28} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={28} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Main stack navigator for authentication flow
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}