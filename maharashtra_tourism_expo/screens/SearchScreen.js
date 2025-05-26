import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker } from 'react-native-maps';

// Categories for filtering
const CATEGORIES = [
  { id: 'attractions', name: 'Attractions', icon: '⭐' },
  { id: 'hotels', name: 'Hotels', icon: '🏨' },
  { id: 'restaurants', name: 'Restaurants', icon: '🍽️' },
  { id: 'medical', name: 'Medical', icon: '🏥' },
  { id: 'atms', name: 'ATMs', icon: '💰' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
];

// Sample nearby places
const NEARBY_PLACES = [
  { 
    id: '1', 
    name: 'Gateway of India', 
    address: 'Apollo Bandar, Colaba, Mumbai', 
    distance: '1.2 km',
    category: 'attractions'
  },
  { 
    id: '2', 
    name: 'Taj Mahal Palace Hotel', 
    address: 'Apollo Bandar, Colaba, Mumbai', 
    distance: '1.3 km',
    category: 'hotels'
  },
  { 
    id: '3', 
    name: 'Leopold Cafe', 
    address: 'Colaba Causeway, Mumbai', 
    distance: '1.5 km',
    category: 'restaurants'
  },
  { 
    id: '4', 
    name: 'Colaba Pharmacy', 
    address: 'Shahid Bhagat Singh Road, Mumbai', 
    distance: '1.8 km',
    category: 'medical'
  },
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('attractions');
  
  // Filter places by selected category
  const filteredPlaces = NEARBY_PLACES.filter(
    place => selectedCategory === 'all' || place.category === selectedCategory
  );
  
  // Get icon for place category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'attractions': return '⭐';
      case 'hotels': return '🏨';
      case 'restaurants': return '🍽️';
      case 'medical': return '🏥';
      case 'atms': return '💰';
      case 'shopping': return '🛍️';
      default: return '📍';
    }
  };
  
  // Render place item
  const renderPlaceItem = ({ item }) => (
    <TouchableOpacity style={styles.placeItem}>
      <View style={[styles.placeIconContainer, { backgroundColor: 'rgba(255, 107, 0, 0.1)' }]}>
        <Text style={styles.placeIcon}>{getCategoryIcon(item.category)}</Text>
      </View>
      <View style={styles.placeInfo}>
        <Text style={styles.placeName}>{item.name}</Text>
        <Text style={styles.placeAddress}>{item.address}</Text>
      </View>
      <View style={styles.distanceBadge}>
        <Text style={styles.distanceText}>{item.distance}</Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Places</Text>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations, attractions..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 18.9220,
            longitude: 72.8347,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{ latitude: 18.9220, longitude: 72.8347 }}
            title="Gateway of India"
          />
        </MapView>
      </View>
      
      <View style={styles.placesContainer}>
        <Text style={styles.sectionTitle}>Nearby Places</Text>
        <FlatList
          data={filteredPlaces}
          renderItem={renderPlaceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.placesList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  categoriesContainer: {
    paddingBottom: 8,
    paddingTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FF6B00',
  },
  categoryIcon: {
    marginRight: 4,
    fontSize: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B00',
  },
  categoryNameActive: {
    color: 'white',
  },
  mapContainer: {
    height: 200,
    borderRadius: 0,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  placesContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  placesList: {
    paddingBottom: 16,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeIcon: {
    fontSize: 20,
    color: '#FF6B00',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 13,
    color: '#666',
  },
  distanceBadge: {
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
});