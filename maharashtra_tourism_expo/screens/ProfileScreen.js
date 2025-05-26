import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={60} color="#ddd" />
          </View>
          <Text style={styles.profileName}>Aryan Varma</Text>
          <Text style={styles.profileEmail}>aryan.varma@example.com</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Guides</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.becomeTourGuide}>
          <MaterialCommunityIcons name="account-tie" size={40} color="#FF6B00" />
          <View style={styles.becomeTourGuideInfo}>
            <Text style={styles.becomeTourGuideTitle}>Share your local expertise</Text>
            <Text style={styles.becomeTourGuideSubtitle}>
              Become a guide and earn by showing tourists around Maharashtra
            </Text>
          </View>
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Account</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#FF6B00" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Saved Places</Text>
              <Text style={styles.menuSubtitle}>View your saved locations</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="history" size={24} color="#FF6B00" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Trip History</Text>
              <Text style={styles.menuSubtitle}>View past trips</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="credit-card" size={24} color="#FF6B00" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Payments & Refunds</Text>
              <Text style={styles.menuSubtitle}>Manage your payment methods</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="bell" size={24} color="#FF6B00" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Notifications</Text>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleCircle} />
            </View>
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#FF6B00" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Location Services</Text>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleCircle} />
            </View>
          </View>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="translate" size={24} color="#FF6B00" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Language</Text>
              <Text style={styles.menuSubtitle}>English</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="shield-lock" size={24} color="#FF6B00" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Privacy & Security</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => navigation.navigate('Welcome')}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
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
    paddingVertical: 12,
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    marginTop: 8,
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
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  becomeTourGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EE',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  becomeTourGuideInfo: {
    flex: 1,
    marginLeft: 12,
  },
  becomeTourGuideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  becomeTourGuideSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  applyButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuInfo: {
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
  toggle: {
    width: 40,
    height: 20,
    backgroundColor: '#FFCCA9',
    borderRadius: 10,
    padding: 2,
    position: 'relative',
  },
  toggleCircle: {
    width: 16,
    height: 16,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    position: 'absolute',
    right: 2,
    top: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEDED',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 36,
  },
  logoutText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 60,
  },
});