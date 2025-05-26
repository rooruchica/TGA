import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Define booking categories
const BOOKING_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'hotel', name: 'Hotels', icon: 'hotel' },
  { id: 'transport', name: 'Transport', icon: 'bus' },
  { id: 'guide', name: 'Guides', icon: 'account-tie' },
];

// Sample booking data
const BOOKINGS = [
  { 
    id: '1', 
    type: 'hotel', 
    name: 'Taj Mahal Palace', 
    location: 'Mumbai', 
    date: '12 Apr - 15 Apr, 2025', 
    status: 'confirmed', 
    price: '₹34,500',
    image: require('../assets/place-placeholder.png')
  },
  { 
    id: '2', 
    type: 'transport', 
    mode: 'Bus', 
    from: 'Mumbai', 
    to: 'Pune', 
    date: '11 Apr, 2025', 
    time: '10:30 AM', 
    status: 'upcoming', 
    price: '₹800',
    image: require('../assets/place-placeholder.png')
  },
  { 
    id: '3', 
    type: 'guide', 
    name: 'Rahul Sharma', 
    location: 'Ajanta Caves', 
    date: '15 Apr, 2025', 
    time: '9:00 AM - 2:00 PM', 
    status: 'pending', 
    price: '₹2,500',
    image: require('../assets/guide-placeholder.png')
  },
];

export default function BookingsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Filter bookings by selected category
  const filteredBookings = selectedCategory === 'all' 
    ? BOOKINGS 
    : BOOKINGS.filter(booking => booking.type === selectedCategory);
  
  // Get status color based on booking status
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'upcoming': return '#2196F3';
      case 'pending': return '#FFC107';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };
  
  // Get icon for booking type
  const getBookingTypeIcon = (type) => {
    switch (type) {
      case 'hotel': return 'hotel';
      case 'transport': return 'bus';
      case 'guide': return 'account-tie';
      default: return 'bookmark';
    }
  };
  
  // Render booking item
  const renderBookingItem = ({ item }) => {
    const booking = item;
    const statusColor = getStatusColor(booking.status);
    
    return (
      <View style={styles.bookingCard}>
        <Image source={booking.image} style={styles.bookingImage} />
        <View style={styles.bookingContent}>
          <View style={styles.bookingHeader}>
            <View>
              <Text style={styles.bookingTitle}>
                {booking.type === 'hotel' && booking.name}
                {booking.type === 'transport' && `${booking.mode}: ${booking.from} - ${booking.to}`}
                {booking.type === 'guide' && `Guide: ${booking.name}`}
              </Text>
              <Text style={styles.bookingSubtitle}>
                {booking.type === 'hotel' && booking.location}
                {booking.type === 'transport' && `${booking.date}, ${booking.time}`}
                {booking.type === 'guide' && `${booking.location}, ${booking.date}`}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.bookingDetails}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons 
                name={booking.type === 'hotel' ? 'calendar' : 'clock-outline'} 
                size={16} 
                color="#666" 
              />
              <Text style={styles.detailText}>
                {booking.type === 'hotel' ? booking.date : booking.time || booking.date}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="currency-inr" size={16} color="#666" />
              <Text style={styles.detailText}>{booking.price}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            {booking.status !== 'cancelled' && (
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="pencil" size={16} color="#FF6B00" />
                <Text style={[styles.actionButtonText, { color: '#FF6B00' }]}>Modify</Text>
              </TouchableOpacity>
            )}
            
            {booking.status !== 'cancelled' && (
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="close" size={16} color="#F44336" />
                <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="ticket" size={16} color="#2196F3" />
              <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#FF6B00" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={BOOKING_CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              {item.icon && (
                <MaterialCommunityIcons
                  name={item.icon}
                  size={18}
                  color={selectedCategory === item.id ? '#fff' : '#666'}
                  style={styles.categoryIcon}
                />
              )}
              <Text
                style={[
                  styles.categoryName,
                  selectedCategory === item.id && styles.categoryNameActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.bookingsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyMessage}>
              You don't have any {selectedCategory !== 'all' ? selectedCategory : ''} bookings yet.
            </Text>
            <TouchableOpacity style={styles.browseButton}>
              <Text style={styles.browseButtonText}>Explore Places</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FF6B00',
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryNameActive: {
    color: '#fff',
  },
  bookingsList: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  bookingImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});