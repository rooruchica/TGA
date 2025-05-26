import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Sample Maharashtra cities
const MAHARASHTRA_CITIES = [
  'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 
  'Kolhapur', 'Solapur', 'Amravati', 'Nanded', 'Sangli'
];

// Sample tourist attractions
const TOURIST_ATTRACTIONS = [
  { name: 'Gateway of India', city: 'Mumbai', coordinate: { latitude: 18.9220, longitude: 72.8347 } },
  { name: 'Ajanta Caves', city: 'Aurangabad', coordinate: { latitude: 20.5519, longitude: 75.7034 } },
  { name: 'Ellora Caves', city: 'Aurangabad', coordinate: { latitude: 20.0258, longitude: 75.1780 } },
  { name: 'Shaniwar Wada', city: 'Pune', coordinate: { latitude: 18.5195, longitude: 73.8553 } },
  { name: 'Lonavala', city: 'Pune', coordinate: { latitude: 18.7546, longitude: 73.4062 } },
  { name: 'Mahabaleshwar', city: 'Satara', coordinate: { latitude: 17.9307, longitude: 73.6477 } },
];

export default function TripPlannerScreen() {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsFor, setSuggestionsFor] = useState('from');
  const [filteredCities, setFilteredCities] = useState(MAHARASHTRA_CITIES);
  
  // For map integration
  const [markers, setMarkers] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  
  // Filter cities based on input
  const filterCities = (text, field) => {
    if (field === 'from') {
      setFromCity(text);
    } else {
      setToCity(text);
    }
    
    setSuggestionsFor(field);
    
    if (text.length > 0) {
      const filtered = MAHARASHTRA_CITIES.filter(
        city => city.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCities([]);
      setShowSuggestions(false);
    }
  };
  
  const selectCity = (city) => {
    if (suggestionsFor === 'from') {
      setFromCity(city);
    } else {
      setToCity(city);
    }
    setShowSuggestions(false);
    
    // Update map markers
    updateMapView(suggestionsFor === 'from' ? city : fromCity, suggestionsFor === 'to' ? city : toCity);
  };
  
  const updateMapView = (from, to) => {
    if (!from || !to) return;
    
    // Find attractions in the selected cities
    const fromAttractions = TOURIST_ATTRACTIONS.filter(attr => attr.city === from);
    const toAttractions = TOURIST_ATTRACTIONS.filter(attr => attr.city === to);
    
    // Create markers
    const newMarkers = [...fromAttractions, ...toAttractions];
    setMarkers(newMarkers);
    
    // Create a simple route path
    if (fromAttractions.length > 0 && toAttractions.length > 0) {
      setRoutePath([
        fromAttractions[0].coordinate,
        toAttractions[0].coordinate,
      ]);
    }
  };
  
  const planTrip = () => {
    // In a real app, this would submit data and show results
    alert(`Planning trip from ${fromCity} to ${toCity}`);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan Your Trip</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Inputs */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>From</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#FF6B00" />
            <TextInput
              style={styles.input}
              placeholder="Origin city"
              value={fromCity}
              onChangeText={(text) => filterCities(text, 'from')}
              onFocus={() => {
                setSuggestionsFor('from');
                setShowSuggestions(fromCity.length > 0);
              }}
            />
            {fromCity ? (
              <TouchableOpacity onPress={() => setFromCity('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>To</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="map-marker-radius" size={24} color="#FF6B00" />
            <TextInput
              style={styles.input}
              placeholder="Destination city"
              value={toCity}
              onChangeText={(text) => filterCities(text, 'to')}
              onFocus={() => {
                setSuggestionsFor('to');
                setShowSuggestions(toCity.length > 0);
              }}
            />
            {toCity ? (
              <TouchableOpacity onPress={() => setToCity('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        
        {/* Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              style={styles.suggestionsList}
              nestedScrollEnabled={true}
            >
              {filteredCities.map((city, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => selectCity(city)}
                >
                  <MaterialCommunityIcons name="city" size={20} color="#666" />
                  <Text style={styles.suggestionText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Date Inputs */}
        <View style={styles.dateContainer}>
          <View style={styles.dateInput}>
            <Text style={styles.inputLabel}>Departure Date</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="calendar" size={24} color="#FF6B00" />
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={departureDate}
                onChangeText={setDepartureDate}
              />
            </View>
          </View>
          
          <View style={styles.dateInput}>
            <Text style={styles.inputLabel}>Return Date</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="calendar" size={24} color="#FF6B00" />
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={returnDate}
                onChangeText={setReturnDate}
              />
            </View>
          </View>
        </View>
        
        {/* Travelers */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Travelers</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="account-group" size={24} color="#FF6B00" />
            <TextInput
              style={styles.input}
              placeholder="Number of travelers"
              keyboardType="number-pad"
              value={travelers}
              onChangeText={setTravelers}
            />
          </View>
        </View>
        
        {/* Map View */}
        {fromCity && toCity && (
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Your Route</Text>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={{
                latitude: 18.9220,
                longitude: 72.8347,
                latitudeDelta: 5,
                longitudeDelta: 5,
              }}
            >
              {markers.map((marker, index) => (
                <Marker
                  key={index}
                  coordinate={marker.coordinate}
                  title={marker.name}
                  description={marker.city}
                />
              ))}
              
              {routePath.length > 0 && (
                <Polyline
                  coordinates={routePath}
                  strokeWidth={3}
                  strokeColor="#FF6B00"
                />
              )}
            </MapView>
          </View>
        )}
        
        {/* Suggested Itineraries */}
        {fromCity && toCity && (
          <View style={styles.suggestedSection}>
            <Text style={styles.sectionTitle}>Suggested Itineraries</Text>
            <TouchableOpacity style={styles.itineraryCard}>
              <View style={styles.itineraryHeader}>
                <Text style={styles.itineraryTitle}>3-Day Adventure</Text>
                <View style={styles.itineraryBadge}>
                  <Text style={styles.itineraryBadgeText}>Popular</Text>
                </View>
              </View>
              <Text style={styles.itineraryDescription}>
                Explore the best attractions between {fromCity} and {toCity} in 3 days.
              </Text>
              <View style={styles.itineraryDetails}>
                <View style={styles.itineraryDetail}>
                  <MaterialCommunityIcons name="map-marker-multiple" size={18} color="#666" />
                  <Text style={styles.detailText}>5 Places</Text>
                </View>
                <View style={styles.itineraryDetail}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
                  <Text style={styles.detailText}>3 Days</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.itineraryCard}>
              <View style={styles.itineraryHeader}>
                <Text style={styles.itineraryTitle}>Weekend Getaway</Text>
                <View style={styles.itineraryBadge}>
                  <Text style={styles.itineraryBadgeText}>Quick</Text>
                </View>
              </View>
              <Text style={styles.itineraryDescription}>
                Perfect weekend trip between {fromCity} and {toCity} with essential stops.
              </Text>
              <View style={styles.itineraryDetails}>
                <View style={styles.itineraryDetail}>
                  <MaterialCommunityIcons name="map-marker-multiple" size={18} color="#666" />
                  <Text style={styles.detailText}>3 Places</Text>
                </View>
                <View style={styles.itineraryDetail}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
                  <Text style={styles.detailText}>2 Days</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Plan Trip Button */}
        <TouchableOpacity 
          style={[
            styles.planButton,
            (!fromCity || !toCity) && styles.disabledButton
          ]}
          onPress={planTrip}
          disabled={!fromCity || !toCity}
        >
          <Text style={styles.planButtonText}>Plan My Trip</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.bottomSpace} />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  suggestionsContainer: {
    marginTop: -8,
    marginBottom: 16,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateInput: {
    width: '48%',
  },
  mapContainer: {
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    height: 200,
    width: '100%',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  suggestedSection: {
    marginVertical: 16,
  },
  itineraryCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itineraryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itineraryBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itineraryBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  itineraryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  itineraryDetails: {
    flexDirection: 'row',
  },
  itineraryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  planButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  bottomSpace: {
    height: 40,
  },
});