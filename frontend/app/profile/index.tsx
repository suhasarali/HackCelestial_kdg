// app/profile/index.tsx

import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
//import { useTranslation } from 'react-i18next';

const API_BASE_URL = 'https://hackcelestial-kdg.onrender.com/api'; // Update if needed

export default function ProfileScreen() {
  const router = useRouter();
  //const { t, i18n } = useTranslation();
  //const [isEnglish, setIsEnglish] = useState(i18n.language === 'en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMapsEnabled, setOfflineMapsEnabled] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Replace hardcoded user with state
  const [user, setUser] = useState({
    name: '',
    phone: '',
    vessel: '',
    homePort: '',
    experience: '',
  });
  const [editUser, setEditUser] = useState(user);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/profile/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setUser({
            name: data.profile.name,
            phone: data.profile.phone || '',
            vessel: data.profile.boatLicenseId || '',
            homePort: data.profile.port || '',
            experience: data.profile.experience ? `${data.profile.experience} years` : '',
          });
          setEditUser({
            name: data.profile.name,
            phone: data.profile.phone || '',
            vessel: data.profile.boatLicenseId || '',
            homePort: data.profile.port || '',
            experience: data.profile.experience ? `${data.profile.experience} years` : '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  // Add update profile handler
  const handleEditProfile = async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/profile/profile-update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editUser.name,
          experience: editUser.experience.replace(' years', ''),
          boatLicenseId: editUser.vessel,
          port: editUser.homePort,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'Profile updated!');
        setUser({
          name: data.profile.name,
          phone: data.profile.phone || '',
          vessel: data.profile.boatLicenseId || '',
          homePort: data.profile.port || '',
          experience: data.profile.experience ? `${data.profile.experience} years` : '',
        });
        setEditMode(false);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLanguageChange = (value: boolean) => {
    //setIsEnglish(value);
    //i18n.changeLanguage(value ? 'en' : 'hi');
  };

  const handleLogout = async () => {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("authToken");

            console.log("User logged out, navigating to login screen");
            router.replace("/auth/login");
          } catch (error) {
            console.error("Logout failed:", error);
          }
        }
      }
    ]
  );
};

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/(tabs)/home')}
        >
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Icon name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userPhone}>{user.phone}</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{('profileInfo')}</Text>
        
        <View style={styles.infoItem}>
          <Icon name="ship-wheel" size={20} color="#3498db" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{('vessel')}</Text>
            {editMode ? (
              <TextInput
                style={styles.infoValue}
                value={editUser.vessel}
                onChangeText={text => setEditUser({ ...editUser, vessel: text })}
              />
            ) : (
              <Text style={styles.infoValue}>{user.vessel}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoItem}>
          <Icon name="map-marker" size={20} color="#3498db" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{('homePort')}</Text>
            {editMode ? (
              <TextInput
                style={styles.infoValue}
                value={editUser.homePort}
                onChangeText={text => setEditUser({ ...editUser, homePort: text })}
              />
            ) : (
              <Text style={styles.infoValue}>{user.homePort}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoItem}>
          <Icon name="clock" size={20} color="#3498db" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{('experience')}</Text>
            {editMode ? (
              <TextInput
                style={styles.infoValue}
                value={editUser.experience}
                onChangeText={text => setEditUser({ ...editUser, experience: text })}
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.infoValue}>{user.experience}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>
            {editMode ? 'Save Profile' : ('editProfile')}
          </Text>
        </TouchableOpacity>
        {editMode && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: '#bdc3c7', marginTop: 8 }]}
            onPress={() => { setEditMode(false); setEditUser(user); }}
          >
            <Text style={styles.editButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{('settings')}</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="translate" size={20} color="#3498db" />
            <Text style={styles.settingLabel}>{('language')}</Text>
          </View>
          <View style={styles.languageToggle}>
            <Text style={styles.languageText}>हिंदी</Text>
            
            <Text style={styles.languageText}>English</Text>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="bell" size={20} color="#3498db" />
            <Text style={styles.settingLabel}>{('notifications')}</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#bdc3c7', true: '#3498db' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="map" size={20} color="#3498db" />
            <Text style={styles.settingLabel}>{('offlineMaps')}</Text>
          </View>
          <Switch
            value={offlineMapsEnabled}
            onValueChange={setOfflineMapsEnabled}
            trackColor={{ false: '#bdc3c7', true: '#3498db' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="volume-high" size={20} color="#3498db" />
            <Text style={styles.settingLabel}>{('voiceCommands')}</Text>
          </View>
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>{('configure')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{('support')}</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="help-circle" size={20} color="#3498db" />
          <Text style={styles.menuText}>{('helpFAQ')}</Text>
          <Icon name="chevron-right" size={20} color="#bdc3c7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="shield-check" size={20} color="#3498db" />
          <Text style={styles.menuText}>{('safetyGuidelines')}</Text>
          <Icon name="chevron-right" size={20} color="#bdc3c7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="file-document" size={20} color="#3498db" />
          <Text style={styles.menuText}>{('regulations')}</Text>
          <Icon name="chevron-right" size={20} color="#bdc3c7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="email" size={20} color="#3498db" />
          <Text style={styles.menuText}>{('contactSupport')}</Text>
          <Icon name="chevron-right" size={20} color="#bdc3c7" />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{('aboutApp')}</Text>
        <Text style={styles.appVersion}>HackCelestial 2.0 v1.0.0</Text>
        <Text style={styles.appDescription}>
          {('appDescription')}
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#e74c3c" />
        <Text style={styles.logoutText}>{('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3498db',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  settingButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  settingButtonText: {
    color: '#3498db',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  appVersion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 8,
  },
  logoutText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
});