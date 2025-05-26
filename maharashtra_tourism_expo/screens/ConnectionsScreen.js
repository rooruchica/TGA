import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Sample guide data
const GUIDES = [
  {
    id: '1',
    name: 'Rahul Sharma',
    expertise: 'Mumbai Historical Sites',
    location: 'Mumbai',
    rating: 4.8,
    price: '₹2500/day',
    languages: ['English', 'Hindi', 'Marathi'],
    status: 'accepted', // 'pending', 'accepted', 'rejected'
    image: require('../assets/guide-placeholder.png'),
  },
  {
    id: '2',
    name: 'Priya Patel',
    expertise: 'Cave Architecture & History',
    location: 'Aurangabad',
    rating: 4.9,
    price: '₹3000/day',
    languages: ['English', 'Hindi', 'Gujarati'],
    status: 'pending',
    image: require('../assets/guide-placeholder.png'),
  },
  {
    id: '3',
    name: 'Amit Joshi',
    expertise: 'Wildlife & Nature Tours',
    location: 'Tadoba',
    rating: 4.7,
    price: '₹2800/day',
    languages: ['English', 'Hindi', 'Marathi'],
    status: 'rejected',
    image: require('../assets/guide-placeholder.png'),
  },
  {
    id: '4',
    name: 'Sneha Deshmukh',
    expertise: 'Coastal Maharashtra Tours',
    location: 'Ratnagiri',
    rating: 4.6,
    price: '₹2200/day',
    languages: ['English', 'Hindi', 'Marathi', 'Konkani'],
    status: 'accepted',
    image: require('../assets/guide-placeholder.png'),
  },
];

// Tab items for filtering
const TAB_ITEMS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'accepted', label: 'Accepted', icon: 'check-circle', color: '#4CAF50' },
  { id: 'pending', label: 'Pending', icon: 'clock-outline', color: '#FFC107' },
  { id: 'rejected', label: 'Rejected', icon: 'close-circle', color: '#F44336' },
];

export default function ConnectionsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter guides based on active tab
  const filteredGuides = activeTab === 'all' 
    ? GUIDES 
    : GUIDES.filter(guide => guide.status === activeTab);
  
  // Get color based on guide status
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#4CAF50';
      case 'pending': return '#FFC107';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };
  
  // Get action text based on guide status
  const getStatusAction = (status) => {
    switch (status) {
      case 'accepted': return 'Contact';
      case 'pending': return 'Pending';
      case 'rejected': return 'Request Again';
      default: return 'Connect';
    }
  };
  
  // Render guide card
  const renderGuideCard = ({ item }) => {
    const guide = item;
    const statusColor = getStatusColor(guide.status);
    const actionText = getStatusAction(guide.status);
    
    return (
      <View style={styles.guideCard}>
        <View style={styles.cardHeader}>
          <Image source={guide.image} style={styles.guideImage} />
          <View style={styles.guideInfo}>
            <Text style={styles.guideName}>{guide.name}</Text>
            <Text style={styles.guideExpertise}>{guide.expertise}</Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{guide.rating}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {guide.status.charAt(0).toUpperCase() + guide.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#666" />
            <Text style={styles.detailText}>{guide.location}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="currency-inr" size={18} color="#666" />
            <Text style={styles.detailText}>{guide.price}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="translate" size={18} color="#666" />
            <Text style={styles.detailText}>{guide.languages.join(', ')}</Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          {guide.status === 'accepted' && (
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="message-text" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              { 
                backgroundColor: guide.status === 'pending' 
                  ? '#f0f0f0' 
                  : guide.status === 'rejected' 
                    ? '#FFF4EE' 
                    : '#4CAF50'
              }
            ]}
          >
            <MaterialCommunityIcons 
              name={
                guide.status === 'accepted' 
                  ? "phone" 
                  : guide.status === 'pending' 
                    ? "clock-outline" 
                    : "refresh"
              } 
              size={18} 
              color={guide.status === 'pending' ? '#666' : '#fff'} 
            />
            <Text 
              style={[
                styles.actionButtonText, 
                guide.status === 'pending' && { color: '#666' }
              ]}
            >
              {actionText}
            </Text>
          </TouchableOpacity>
          
          {guide.status === 'accepted' && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FFB74D' }]}>
              <MaterialCommunityIcons name="calendar" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Book</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  // Render empty state when no guides match the filter
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="account-group" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No guide connections found</Text>
      <Text style={styles.emptyText}>
        You don't have any {activeTab !== 'all' ? activeTab : ''} guide connections yet.
      </Text>
      <TouchableOpacity style={styles.browseButton}>
        <Text style={styles.browseButtonText}>Browse Local Guides</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Connections</Text>
        <TouchableOpacity style={styles.searchButton}>
          <MaterialCommunityIcons name="magnify" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TAB_ITEMS.map((tab) => (
            <TouchableOpacity 
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              {tab.icon && (
                <MaterialCommunityIcons 
                  name={tab.icon} 
                  size={20} 
                  color={activeTab === tab.id ? '#fff' : tab.color} 
                />
              )}
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredGuides}
        renderItem={renderGuideCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={<View style={styles.bottomSpace} />}
      />
      
      <TouchableOpacity style={styles.floatingButton}>
        <MaterialCommunityIcons name="account-search" size={24} color="#fff" />
        <Text style={styles.floatingButtonText}>Find Guides</Text>
      </TouchableOpacity>
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
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
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
  emptyText: {
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B00',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 80,
  },
});