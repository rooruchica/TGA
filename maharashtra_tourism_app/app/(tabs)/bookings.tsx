import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Sample booking data
const SAMPLE_BOOKINGS = [
  {
    id: 1,
    type: 'hotel',
    name: 'Taj Mahal Palace',
    location: 'Mumbai',
    date: '12 Apr - 15 Apr, 2025',
    status: 'confirmed',
    price: '₹34,500',
    image: require('../../assets/images/placeholder.png'),
  },
  {
    id: 2,
    type: 'transport',
    mode: 'Bus',
    from: 'Mumbai',
    to: 'Pune',
    date: '11 Apr, 2025',
    time: '10:30 AM',
    status: 'upcoming',
    price: '₹800',
    image: require('../../assets/images/placeholder.png'),
  },
  {
    id: 3,
    type: 'guide',
    name: 'Rahul Sharma',
    location: 'Ajanta Caves',
    date: '15 Apr, 2025',
    time: '9:00 AM - 2:00 PM',
    status: 'pending',
    price: '₹2,500',
    image: require('../../assets/images/guide1.png'),
  },
  {
    id: 4,
    type: 'transport',
    mode: 'Train',
    from: 'Pune',
    to: 'Aurangabad',
    date: '15 Apr, 2025',
    time: '7:30 PM',
    status: 'upcoming',
    price: '₹1,200',
    image: require('../../assets/images/placeholder.png'),
  },
  {
    id: 5,
    type: 'hotel',
    name: 'Lemon Tree Hotel',
    location: 'Aurangabad',
    date: '15 Apr - 18 Apr, 2025',
    status: 'upcoming',
    price: '₹15,750',
    image: require('../../assets/images/placeholder.png'),
  },
];

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState('all');
  
  const filteredBookings = activeTab === 'all' 
    ? SAMPLE_BOOKINGS 
    : SAMPLE_BOOKINGS.filter(booking => booking.type === activeTab);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'upcoming': return '#2196F3';
      case 'pending': return '#FFC107';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };
  
  const renderBookingCard = (booking) => {
    const statusColor = getStatusColor(booking.status);
    
    const isHotel = booking.type === 'hotel';
    const isTransport = booking.type === 'transport';
    const isGuide = booking.type === 'guide';
    
    return (
      <TouchableOpacity key={booking.id} style={styles.bookingCard}>
        <Image source={booking.image} style={styles.bookingImage} />
        
        <View style={styles.bookingContent}>
          <View style={styles.bookingHeader}>
            <View>
              <Text style={styles.bookingName}>
                {isHotel && booking.name}
                {isTransport && `${booking.mode}: ${booking.from} - ${booking.to}`}
                {isGuide && `Guide: ${booking.name}`}
              </Text>
              <Text style={styles.bookingLocation}>
                {isHotel && booking.location}
                {isTransport && `${booking.date}, ${booking.time}`}
                {isGuide && `${booking.location}, ${booking.date}`}
              </Text>
            </View>
            
            <View style={[styles.bookingStatus, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.bookingStatusText, { color: statusColor }]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.bookingDetails}>
            <View style={styles.detail}>
              <MaterialCommunityIcons 
                name={isHotel ? "calendar-range" : isTransport ? "clock-outline" : "account-outline"} 
                size={18} 
                color="#666" 
              />
              <Text style={styles.detailText}>
                {isHotel && booking.date}
                {isTransport && booking.time}
                {isGuide && booking.time}
              </Text>
            </View>
            
            <View style={styles.detail}>
              <MaterialCommunityIcons name="currency-inr" size={18} color="#666" />
              <Text style={styles.detailText}>{booking.price}</Text>
            </View>
          </View>
          
          <View style={styles.bookingActions}>
            {booking.status !== 'cancelled' && (
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color="#FF6B00" />
                <Text style={styles.actionText}>Modify</Text>
              </TouchableOpacity>
            )}
            
            {booking.status !== 'cancelled' && (
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="close" size={16} color="#F44336" />
                <Text style={[styles.actionText, { color: '#F44336' }]}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={16} color="#2196F3" />
              <Text style={[styles.actionText, { color: '#2196F3' }]}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'hotel' && styles.activeTab]}
            onPress={() => setActiveTab('hotel')}
          >
            <MaterialCommunityIcons 
              name="bed" 
              size={20} 
              color={activeTab === 'hotel' ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'hotel' && styles.activeTabText]}>Hotels</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'transport' && styles.activeTab]}
            onPress={() => setActiveTab('transport')}
          >
            <MaterialCommunityIcons 
              name="bus" 
              size={20} 
              color={activeTab === 'transport' ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'transport' && styles.activeTabText]}>Transport</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'guide' && styles.activeTab]}
            onPress={() => setActiveTab('guide')}
          >
            <MaterialCommunityIcons 
              name="account-tie" 
              size={20} 
              color={activeTab === 'guide' ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'guide' && styles.activeTabText]}>Guides</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => renderBookingCard(booking))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              You don't have any {activeTab !== 'all' ? activeTab : ''} bookings yet.
            </Text>
            <TouchableOpacity style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>Explore {activeTab !== 'all' ? activeTab + 's' : 'options'}</Text>
            </TouchableOpacity>
          </View>
        )}
        
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
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#FF6B00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#fff',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
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
  bookingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookingLocation: {
    fontSize: 14,
    color: '#666',
  },
  bookingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  bookingActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#FF6B00',
    marginLeft: 4,
    fontWeight: '500',
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
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomSpace: {
    height: 40,
  },
});