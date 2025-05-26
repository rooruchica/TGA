import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const CATEGORIES = [
  { id: '1', name: 'Beaches', icon: '🏖️' },
  { id: '2', name: 'Mountains', icon: '⛰️' },
  { id: '3', name: 'Temples', icon: '🛕' },
  { id: '4', name: 'Forts', icon: '🏰' },
  { id: '5', name: 'Wildlife', icon: '🐯' },
];

const FEATURED_PLACES = [
  { 
    id: '1', 
    name: 'Gateway of India', 
    location: 'Mumbai', 
    image: require('../assets/place-placeholder.png') 
  },
  { 
    id: '2', 
    name: 'Ajanta Caves', 
    location: 'Aurangabad', 
    image: require('../assets/place-placeholder.png') 
  },
  { 
    id: '3', 
    name: 'Ellora Caves', 
    location: 'Aurangabad', 
    image: require('../assets/place-placeholder.png') 
  },
];

const GUIDES = [
  { 
    id: '1', 
    name: 'Rahul Sharma', 
    expertise: 'Mumbai History', 
    rating: 4.8, 
    image: require('../assets/guide-placeholder.png') 
  },
  { 
    id: '2', 
    name: 'Priya Patel', 
    expertise: 'Caves & Architecture', 
    rating: 4.9, 
    image: require('../assets/guide-placeholder.png') 
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.headerTitle}>Explore Maharashtra</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <MaterialCommunityIcons name="account" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={24} color="#666" />
          <Text style={styles.searchPlaceholder}>Search destinations, hotels...</Text>
        </TouchableOpacity>
        
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Places</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredContainer}
          >
            {FEATURED_PLACES.map((place) => (
              <TouchableOpacity key={place.id} style={styles.placeCard}>
                <Image source={place.image} style={styles.placeImage} />
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <View style={styles.locationContainer}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#FF6B00" />
                    <Text style={styles.locationText}>{place.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.guidesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Guides</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Guides')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {GUIDES.map((guide) => (
            <TouchableOpacity key={guide.id} style={styles.guideCard}>
              <Image source={guide.image} style={styles.guideImage} />
              <View style={styles.guideInfo}>
                <Text style={styles.guideName}>{guide.name}</Text>
                <Text style={styles.guideExpertise}>{guide.expertise}</Text>
                <View style={styles.ratingContainer}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{guide.rating}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 24,
    width: 60,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  featuredSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '500',
  },
  featuredContainer: {
    paddingBottom: 8,
  },
  placeCard: {
    width: 250,
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  placeInfo: {
    padding: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  guidesSection: {
    paddingHorizontal: 16,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guideImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  guideInfo: {
    flex: 1,
    marginLeft: 12,
  },
  guideName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  guideExpertise: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  connectButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomPadding: {
    height: 60,
  },
});