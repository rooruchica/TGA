import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

// POI Categories
const categories = [
  { id: 'attraction', name: 'Attractions', icon: 'star-circle' },
  { id: 'hotel', name: 'Hotels', icon: 'bed' },
  { id: 'restaurant', name: 'Restaurants', icon: 'food-fork-drink' },
  { id: 'medical', name: 'Medical', icon: 'medical-bag' },
  { id: 'atm', name: 'ATMs', icon: 'cash' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping' },
];

// Sample search results
const searchResults = [
  {
    id: 1,
    name: 'Gateway of India',
    address: 'Apollo Bandar, Colaba, Mumbai',
    category: 'attraction',
    distance: '1.2 km',
    coordinate: { latitude: 18.9220, longitude: 72.8347 },
  },
  {
    id: 2,
    name: 'Taj Mahal Palace Hotel',
    address: 'Apollo Bandar, Colaba, Mumbai',
    category: 'hotel',
    distance: '1.3 km',
    coordinate: { latitude: 18.9218, longitude: 72.8330 },
  },
  {
    id: 3,
    name: 'Leopold Cafe',
    address: 'Colaba Causeway, Mumbai',
    category: 'restaurant',
    distance: '1.5 km',
    coordinate: { latitude: 18.9225, longitude: 72.8317 },
  },
];

// Default location (Mumbai)
const INITIAL_REGION = {
  latitude: 19.0760,
  longitude: 72.8777,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('attraction');
  const [filteredResults, setFilteredResults] = useState(searchResults);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);
  
  // Get user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error) {
        console.log('Error getting location:', error);
      }
    })();
  }, []);

  // Filter results based on category and search query
  useEffect(() => {
    const results = searchResults.filter(item => {
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesQuery = searchQuery 
        ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.address.toLowerCase().includes(searchQuery.toLowerCase()) 
        : true;
      return matchesCategory && matchesQuery;
    });
    setFilteredResults(results);
  }, [searchQuery, selectedCategory]);

  const focusOnResult = (item) => {
    setMapRegion({
      latitude: item.coordinate.latitude,
      longitude: item.coordinate.longitude,
      latitudeDelta: 0.0122,
      longitudeDelta: 0.0061,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Places</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations, attractions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(category => (
          <TouchableOpacity 
            key={category.id} 
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategory
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <MaterialCommunityIcons 
              name={category.icon} 
              size={20} 
              color={selectedCategory === category.id ? "#fff" : "#FF6B00"} 
            />
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedCategoryText
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {filteredResults.map(result => (
            <Marker
              key={result.id}
              coordinate={result.coordinate}
              title={result.name}
              description={result.address}
            />
          ))}
        </MapView>
      </View>

      {/* Results List */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Nearby Places</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.resultsList}>
          {filteredResults.map(result => (
            <TouchableOpacity 
              key={result.id} 
              style={styles.resultItem}
              onPress={() => focusOnResult(result)}
            >
              <View style={styles.resultIconContainer}>
                <MaterialCommunityIcons 
                  name={categories.find(c => c.id === result.category)?.icon || 'map-marker'} 
                  size={24} 
                  color="#FF6B00" 
                />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={styles.resultAddress}>{result.address}</Text>
              </View>
              <View style={styles.resultDistance}>
                <Text style={styles.distanceText}>{result.distance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    height: '100%',
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedCategory: {
    backgroundColor: '#FF6B00',
  },
  categoryText: {
    fontSize: 14,
    color: '#FF6B00',
    marginLeft: 6,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  mapContainer: {
    height: 220,
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  resultDistance: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
});