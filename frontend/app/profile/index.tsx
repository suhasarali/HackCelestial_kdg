// app/profile/page.tsx
'use client';

import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Switch,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
//import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const router = useRouter();
  //const { t, i18n } = useTranslation();
  //const [isEnglish, setIsEnglish] = useState(i18n.language === 'en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMapsEnabled, setOfflineMapsEnabled] = useState(false);

  const user = {
    name: 'Rajesh Kumar',
    phone: '+91 9876543210',
    vessel: 'Fisherman II',
    homePort: 'Mumbai',
    experience: '15 years',
  };

  const handleLanguageChange = (value: boolean) => {
    //setIsEnglish(value);
    //i18n.changeLanguage(value ? 'en' : 'hi');
  };

  const handleLogout = () => {
    Alert.alert(
      ('logout'),
      ('logoutConfirm'),
      [
        { text: ('cancel'), style: 'cancel' },
        { text: ('logout'), onPress: () => router.replace('/auth/login') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
            <Text style={styles.infoValue}>{user.vessel}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Icon name="map-marker" size={20} color="#3498db" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{('homePort')}</Text>
            <Text style={styles.infoValue}>{user.homePort}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Icon name="clock" size={20} color="#3498db" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{('experience')}</Text>
            <Text style={styles.infoValue}>{user.experience}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>{('editProfile')}</Text>
        </TouchableOpacity>
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