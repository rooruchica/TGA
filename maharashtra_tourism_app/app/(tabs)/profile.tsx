import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Mock user data
const USER = {
  name: 'Aryan Varma',
  email: 'aryan.varma@example.com',
  phone: '+91 98765 43210',
  profileImage: require('../../assets/images/placeholder.png'),
  tripCount: 12,
  savedPlaces: 24,
  connections: 8,
  isGuide: false,
};

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };
  
  const toggleLocation = () => {
    setLocationEnabled(!locationEnabled);
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            // In a real app, handle logout logic here
            router.replace('/auth/login');
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  const renderMenuItem = (icon, title, subtitle, onPress) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <MaterialCommunityIcons name={icon} size={24} color="#FF6B00" />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );
  
  const renderToggleItem = (icon, title, value, onToggle) => (
    <View style={styles.menuItem}>
      <View style={styles.menuIcon}>
        <MaterialCommunityIcons name={icon} size={24} color="#FF6B00" />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e0e0e0', true: '#FFCCA9' }}
        thumbColor={value ? '#FF6B00' : '#f4f3f4'}
      />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={USER.profileImage} style={styles.profileImage} />
          <Text style={styles.profileName}>{USER.name}</Text>
          <Text style={styles.profileEmail}>{USER.email}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{USER.tripCount}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{USER.savedPlaces}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{USER.connections}</Text>
              <Text style={styles.statLabel}>Guides</Text>
            </View>
          </View>
        </View>
        
        {/* Guides Section */}
        {USER.isGuide ? (
          <View style={styles.guideSection}>
            <Text style={styles.sectionTitle}>Guide Profile</Text>
            {renderMenuItem('account-tie', 'Manage Guide Profile', 'Update availability and expertise', () => {})}
            {renderMenuItem('wallet', 'Earnings', 'View your earnings and payouts', () => {})}
            {renderMenuItem('account-group', 'Client Requests', '3 new requests', () => {})}
          </View>
        ) : (
          <View style={styles.guideSection}>
            <Text style={styles.sectionTitle}>Become a Guide</Text>
            <TouchableOpacity style={styles.becomeGuideCard}>
              <MaterialCommunityIcons name="account-tie" size={40} color="#FF6B00" />
              <View style={styles.becomeGuideContent}>
                <Text style={styles.becomeGuideTitle}>Share your local expertise</Text>
                <Text style={styles.becomeGuideText}>Become a guide and earn by showing tourists around Maharashtra</Text>
              </View>
              <TouchableOpacity style={styles.becomeGuideButton}>
                <Text style={styles.becomeGuideButtonText}>Apply</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}
        
        {/* My Account Section */}
        <Text style={styles.sectionTitle}>My Account</Text>
        {renderMenuItem('map-marker-multiple', 'Saved Places', 'View your saved locations', () => {})}
        {renderMenuItem('book-open-variant', 'Trip History', 'View past trips', () => {})}
        {renderMenuItem('credit-card', 'Payments & Refunds', 'Manage your payment methods', () => {})}
        
        {/* Settings Section */}
        <Text style={styles.sectionTitle}>Settings</Text>
        {renderToggleItem('bell', 'Notifications', notificationsEnabled, toggleNotifications)}
        {renderToggleItem('map-marker', 'Location Services', locationEnabled, toggleLocation)}
        {renderMenuItem('translate', 'Language', 'English', () => {})}
        {renderMenuItem('shield-check', 'Privacy & Security', '', () => {})}
        
        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support</Text>
        {renderMenuItem('help-circle', 'Help Center', '', () => {})}
        {renderMenuItem('information', 'About', 'App version 1.0.0', () => {})}
        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Logout</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 24,
  },
  guideSection: {
    marginBottom: 8,
  },
  becomeGuideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  becomeGuideContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  becomeGuideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  becomeGuideText: {
    fontSize: 12,
    color: '#666',
  },
  becomeGuideButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  becomeGuideButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEDED',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 36,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: 8,
  },
  bottomSpace: {
    height: 40,
  },
});