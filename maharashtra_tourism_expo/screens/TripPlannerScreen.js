import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function TripPlannerScreen() {
  const [fromCity, setFromCity] = useState('Mumbai');
  const [toCity, setToCity] = useState('Aurangabad');
  const [departureDate, setDepartureDate] = useState('15/04/2025');
  const [returnDate, setReturnDate] = useState('18/04/2025');
  const [travelers, setTravelers] = useState('2');
  
  // Handle trip planning
  const handlePlanTrip = () => {
    // In a real app, this would navigate to a trip details screen or confirm booking
    alert('Trip planned! Redirecting to itinerary details...');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Plan Your Trip</Text>
        
        <View style={styles.formContainer}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>From</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#FF6B00" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Origin city"
                placeholderTextColor="#999"
                value={fromCity}
                onChangeText={setFromCity}
              />
            </View>
          </View>
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>To</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#FF6B00" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Destination city"
                placeholderTextColor="#999"
                value={toCity}
                onChangeText={setToCity}
              />
            </View>
          </View>
          
          <View style={styles.rowFields}>
            <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>Departure Date</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="calendar" size={24} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#999"
                  value={departureDate}
                  onChangeText={setDepartureDate}
                />
              </View>
            </View>
            
            <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.fieldLabel}>Return Date</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="calendar" size={24} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#999"
                  value={returnDate}
                  onChangeText={setReturnDate}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Travelers</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account-group" size={24} color="#FF6B00" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Number of travelers"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={travelers}
                onChangeText={setTravelers}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Your Route</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 19.1,
                longitude: 73.5,
                latitudeDelta: 3,
                longitudeDelta: 3,
              }}
            >
              <Marker
                coordinate={{ latitude: 19.0760, longitude: 72.8777 }}
                title="Mumbai"
              />
              <Marker
                coordinate={{ latitude: 19.8762, longitude: 75.3433 }}
                title="Aurangabad"
              />
              <Polyline
                coordinates={[
                  { latitude: 19.0760, longitude: 72.8777 },
                  { latitude: 19.8762, longitude: 75.3433 },
                ]}
                strokeColor="#FF6B00"
                strokeWidth={3}
              />
            </MapView>
          </View>
        </View>
        
        <View style={styles.itinerariesSection}>
          <Text style={styles.sectionTitle}>Suggested Itineraries</Text>
          
          <TouchableOpacity style={styles.itineraryCard}>
            <View style={styles.itineraryHeader}>
              <Text style={styles.itineraryTitle}>3-Day Adventure</Text>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Popular</Text>
              </View>
            </View>
            <Text style={styles.itineraryDescription}>
              Explore the best attractions between Mumbai and Aurangabad in 3 days.
            </Text>
            <View style={styles.itineraryDetails}>
              <View style={styles.itineraryDetail}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                <Text style={styles.itineraryDetailText}>5 Places</Text>
              </View>
              <View style={styles.itineraryDetail}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                <Text style={styles.itineraryDetailText}>3 Days</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.itineraryCard}>
            <View style={styles.itineraryHeader}>
              <Text style={styles.itineraryTitle}>Weekend Getaway</Text>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Quick</Text>
              </View>
            </View>
            <Text style={styles.itineraryDescription}>
              Perfect weekend trip between Mumbai and Aurangabad with essential stops.
            </Text>
            <View style={styles.itineraryDetails}>
              <View style={styles.itineraryDetail}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                <Text style={styles.itineraryDetailText}>3 Places</Text>
              </View>
              <View style={styles.itineraryDetail}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                <Text style={styles.itineraryDetailText}>2 Days</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.planButton}
          onPress={handlePlanTrip}
        >
          <Text style={styles.planButtonText}>Plan My Trip</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  rowFields: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mapSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  itinerariesSection: {
    marginBottom: 24,
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
  popularBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    color: 'white',
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
  itineraryDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  planButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});