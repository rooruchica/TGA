import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../assets/welcome-bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>⛰️</Text>
            <Text style={styles.logoText}>Maharashtra Wanderer</Text>
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Discover the Beauty of Maharashtra</Text>
            <Text style={styles.subtitle}>
              Explore historical sites, beautiful beaches, majestic mountains, and vibrant culture
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryButtonText}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.secondaryButtonText}>Register</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.textButton}
              onPress={() => navigation.navigate('Main')}
            >
              <Text style={styles.textButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: '#FF6B00', // Fallback color
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 107, 0, 0.8)', // Semi-transparent overlay
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 60,
    marginBottom: 10,
    color: 'white',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 60,
  },
  primaryButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: 18,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'white',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  textButton: {
    alignItems: 'center',
    padding: 8,
  },
  textButtonText: {
    color: 'white',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});