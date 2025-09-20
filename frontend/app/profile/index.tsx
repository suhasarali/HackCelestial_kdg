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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import React from 'react';

const API_BASE_URL = 'https://hackcelestial-kdg.onrender.com/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isEnglish, setIsEnglish] = useState(i18n.language === 'en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMapsEnabled, setOfflineMapsEnabled] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState({
    name: '',
    phone: '',
    vessel: '',
    homePort: '',
    experience: '',
  });
  const [editUser, setEditUser] = useState(user);

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

  const handleEditProfile = async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }
    
    setLoading(true);
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
        Alert.alert(t('profile.success'), t('profile.profileUpdated'));
        setUser({
          name: data.profile.name,
          phone: data.profile.phone || '',
          vessel: data.profile.boatLicenseId || '',
          homePort: data.profile.port || '',
          experience: data.profile.experience ? `${data.profile.experience} years` : '',
        });
        setEditMode(false);
      } else {
        Alert.alert(t('profile.error'), data.message);
      }
    } catch (error) {
      Alert.alert(t('profile.error'), t('profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (value: boolean) => {
    setIsEnglish(value);
    i18n.changeLanguage(value ? 'en' : 'hi');
  };

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('profile.cancelButton'), style: "cancel" },
        {
          text: t('profile.logoutButton'),
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.push('/(tabs)/home')}
            >
              <Icon name="arrow-left" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
            <View style={{ width: 40 }} /> {/* Spacer for balance */}
          </View>
        
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'data:image/png;base64,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' }}
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
          <Text style={styles.sectionTitle}>{t('profile.profileInfo')}</Text>
        
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="ship-wheel" size={20} color="#3498db" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.vessel')}</Text>
              {editMode ? (
                <TextInput
                  style={styles.infoInput}
                  value={editUser.vessel}
                  onChangeText={text => setEditUser({ ...editUser, vessel: text })}
                  placeholder={t('profile.vesselPlaceholder')}
                />
              ) : (
                <Text style={styles.infoValue}>{user.vessel || t('profile.notSpecified')}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="map-marker" size={20} color="#3498db" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.homePort')}</Text>
              {editMode ? (
                <TextInput
                  style={styles.infoInput}
                  value={editUser.homePort}
                  onChangeText={text => setEditUser({ ...editUser, homePort: text })}
                  placeholder={t('profile.homePortPlaceholder')}
                />
              ) : (
                <Text style={styles.infoValue}>{user.homePort || t('profile.notSpecified')}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Icon name="clock" size={20} color="#3498db" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.experience')}</Text>
              {editMode ? (
                <TextInput
                  style={styles.infoInput}
                  value={editUser.experience}
                  onChangeText={text => setEditUser({ ...editUser, experience: text })}
                  keyboardType="numeric"
                  placeholder={t('profile.experiencePlaceholder')}
                />
              ) : (
                <Text style={styles.infoValue}>{user.experience || t('profile.notSpecified')}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.editButton, loading && styles.editButtonDisabled]} 
            onPress={handleEditProfile}
            disabled={loading}
          >
            <Text style={styles.editButtonText}>
              {loading ? t('profile.loading') : 
               editMode ? t('profile.saveProfile') : t('profile.editProfile')}
            </Text>
          </TouchableOpacity>
          
          {editMode && (
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={() => { setEditMode(false); setEditUser(user); }}
              disabled={loading}
            >
              <Text style={[styles.editButtonText, styles.cancelButtonText]}>{t('profile.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <Icon name="translate" size={20} color="#3498db" />
              </View>
              <Text style={styles.settingLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.languageToggle}>
              <Text style={[styles.languageText, !isEnglish && styles.activeLanguageText]}>हिंदी</Text>
              <Switch
                value={isEnglish}
                onValueChange={handleLanguageChange}
                trackColor={{ false: '#bdc3c7', true: '#3498db' }}
                thumbColor={isEnglish ? '#fff' : '#fff'}
                style={styles.languageSwitch}
              />
              <Text style={[styles.languageText, isEnglish && styles.activeLanguageText]}>English</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <Icon name="bell" size={20} color="#3498db" />
              </View>
              <Text style={styles.settingLabel}>{t('profile.notifications')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#bdc3c7', true: '#3498db' }}
              thumbColor={notificationsEnabled ? '#fff' : '#fff'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <Icon name="map" size={20} color="#3498db" />
              </View>
              <Text style={styles.settingLabel}>{t('profile.offlineMaps')}</Text>
            </View>
            <Switch
              value={offlineMapsEnabled}
              onValueChange={setOfflineMapsEnabled}
              trackColor={{ false: '#bdc3c7', true: '#3498db' }}
              thumbColor={offlineMapsEnabled ? '#fff' : '#fff'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <Icon name="volume-high" size={20} color="#3498db" />
              </View>
              <Text style={styles.settingLabel}>{t('profile.voiceCommands')}</Text>
            </View>
            <TouchableOpacity style={styles.settingButton}>
              <Text style={styles.settingButtonText}>{t('profile.configure')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.support')}</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Icon name="help-circle" size={20} color="#3498db" />
            </View>
            <Text style={styles.menuText}>{t('profile.helpFAQ')}</Text>
            <Icon name="chevron-right" size={20} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Icon name="shield-check" size={20} color="#3498db" />
            </View>
            <Text style={styles.menuText}>{t('profile.safetyGuidelines')}</Text>
            <Icon name="chevron-right" size={20} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Icon name="file-document" size={20} color="#3498db" />
            </View>
            <Text style={styles.menuText}>{t('profile.regulations')}</Text>
            <Icon name="chevron-right" size={20} color="#bdc3c7" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Icon name="email" size={20} color="#3498db" />
            </View>
            <Text style={styles.menuText}>{t('profile.contactSupport')}</Text>
            <Icon name="chevron-right" size={20} color="#bdc3c7" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.aboutApp')}</Text>
          <Text style={styles.appVersion}>HackCelestial 2.0 v1.0.0</Text>
          <Text style={styles.appDescription}>
            {t('profile.appDescription')}
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#e74c3c" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    marginRight: 16,
    marginLeft: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  backButton: {
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
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#3498db',
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
    borderWidth: 2,
    borderColor: '#fff',
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#3498db',
    paddingVertical: 4,
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButtonDisabled: {
    opacity: 0.7,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    shadowColor: '#bdc3c7',
  },
  cancelButtonText: {
    color: '#7f8c8d',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
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
  activeLanguageText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  languageSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  settingButton: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settingButtonText: {
    color: '#3498db',
    fontWeight: '500',
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    gap: 12,
    backgroundColor: '#fff',
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 30,
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  logoutText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
});