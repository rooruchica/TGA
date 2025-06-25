import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, Modal, Image, Button, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GOOGLE_MAPS_API_KEY = "AIzaSyDP_WWujZfWVS5zVnThVnZP7cFLCicWuwI";
const { width, height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 19.0760,
  longitude: 72.8777,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function SearchScreen() {
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [marker, setMarker] = useState(null);
  const mapRef = useRef(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder="Search for places..."
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details && details.geometry && details.geometry.location) {
              const location = details.geometry.location;
              setMapRegion({
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.0122,
                longitudeDelta: 0.0061,
              });
              setMarker({
                latitude: location.lat,
                longitude: location.lng,
                name: details.name,
                address: details.formatted_address,
                photo: details.photos && details.photos.length > 0 ? details.photos[0].photo_reference : null,
                details,
              });
              setSelectedPlace(details);
              // Animate map
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: location.lat,
                  longitude: location.lng,
                  latitudeDelta: 0.0122,
                  longitudeDelta: 0.0061,
                }, 1000);
              }
            }
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
          }}
          styles={{
            container: { flex: 0, zIndex: 1, position: 'absolute', width: '100%', top: 0 },
            listView: { backgroundColor: 'white' },
          }}
          enablePoweredByContainer={false}
        />
      </View>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
        >
          {marker && (
            <Marker
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              title={marker.name}
              description={marker.address}
              onPress={() => setSelectedPlace(marker.details)}
            />
          )}
        </MapView>
      </View>
      {/* Place Details Modal */}
      <Modal visible={!!selectedPlace} animationType="slide" transparent onRequestClose={() => setSelectedPlace(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.placeName}>{selectedPlace?.name}</Text>
            <Text style={styles.placeAddress}>{selectedPlace?.formatted_address}</Text>
            {selectedPlace?.photos && selectedPlace.photos.length > 0 && (
              <Image
                source={{ uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${selectedPlace.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}` }}
                style={styles.placeImage}
                resizeMode="cover"
              />
            )}
            {selectedPlace?.rating && (
              <Text style={styles.placeRating}>Rating: {selectedPlace.rating} ⭐</Text>
            )}
            <Button title="Close" onPress={() => setSelectedPlace(null)} />
              </View>
              </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  autocompleteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    width: '100%',
    padding: 8,
    backgroundColor: 'transparent',
  },
  mapContainer: {
    flex: 1,
    marginTop: 60, // leave space for autocomplete
    marginBottom: 64, // leave space for navbar
  },
  map: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  placeName: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeImage: {
    width: width - 64,
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  placeRating: {
    fontSize: 16,
    marginBottom: 12,
  },
});