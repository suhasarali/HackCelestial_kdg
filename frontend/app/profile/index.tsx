import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../../constants/design';
import i18nInstance from '../../i18n';

const API_BASE_URL = 'https://hackcelestial-kdg.onrender.com/api';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  // State Management
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [user, setUser] = useState({
    name: '',
    email: '',
    vessel: '',
    homePort: '',
    experience: '',
  });

  const [editUser, setEditUser] = useState(user);

  // Fetch Profile Data
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
        console.log('Profile Data:', data.profile);
        if (data.success) {
          const profileData = {
            name: data.profile.name,
            email: data.profile.email || '',
            vessel: data.profile.boatLicenseId || '',
            homePort: data.profile.port || '',
            experience: data.profile.experience ? `${data.profile.experience} years` : '',
          };
          setUser(profileData);
          setEditUser(profileData);
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
        const updatedData = {
          name: data.profile.name,
          email: data.profile.email || '',
          vessel: data.profile.boatLicenseId || '',
          homePort: data.profile.port || '',
          experience: data.profile.experience ? `${data.profile.experience} years` : '',
        };
        setUser(updatedData);
        setEditMode(false);
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (langCode: string) => {
    // Navigate with the direct instance to be safe
    if (i18nInstance.changeLanguage) {
        await i18nInstance.changeLanguage(langCode);
    } else if (i18n && i18n.changeLanguage) {
        await i18n.changeLanguage(langCode);
    }
  };

  const getLanguageName = (code: string) => {
    return LANGUAGES.find(l => l.code === code)?.nativeName || 'English';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <LinearGradient colors={[Colors.primary, '#1A5F7A']} style={styles.headerBackground}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
            <TouchableOpacity onPress={handleEditProfile} style={styles.backButton}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name={editMode ? "check" : "pencil"} size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://st.depositphotos.com/2218212/2938/i/950/depositphotos_29387653-stock-photo-facebook-profile.jpg' }} 
                style={styles.avatar} 
              />
            </View>
            {editMode ? (
              <TextInput 
                style={[styles.userName, styles.inputUnderline]} 
                value={editUser.name}
                onChangeText={(text) => setEditUser({...editUser, name: text})}
              />
            ) : (
              <Text style={styles.userName}>{user.name}</Text>
            )}
            <Text style={styles.userPhone}>{user.email}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.profileInfo')}</Text>
          
          {/* Vessel Info */}
          <InfoRow 
            icon="ship-wheel" 
            label={t('profile.vessel')} 
            value={editMode ? editUser.vessel : user.vessel}
            isEditing={editMode}
            onChange={(text:any) => setEditUser({...editUser, vessel: text})}
          />
          <View style={styles.divider} />
          
          {/* Home Port */}
          <InfoRow 
            icon="map-marker" 
            label={t('profile.homePort')} 
            value={editMode ? editUser.homePort : user.homePort}
            isEditing={editMode}
            onChange={(text:any) => setEditUser({...editUser, homePort: text})}
          />
          <View style={styles.divider} />

          {/* Experience */}
          <InfoRow 
            icon="clock-outline" 
            label={t('profile.experience')} 
            value={editMode ? editUser.experience : user.experience}
            isEditing={editMode}
            onChange={(text:any) => setEditUser({...editUser, experience: text})}
            keyboardType="numeric"
          />
        </View>

        {/* Language & Settings */}
        {!editMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
            <TouchableOpacity style={styles.settingRow} onPress={() => setLangModalVisible(true)}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBox, { backgroundColor: '#E0F2F1' }]}>
                  <Icon name="translate" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>{t('profile.language')}</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{getLanguageName(i18n.language)}</Text>
                <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      {/* Language Modal remains the same... */}
       {/* Language Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang.code} 
                style={[
                  styles.langOption, 
                  i18n.language === lang.code && styles.langOptionActive
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={[
                  styles.langName, 
                  i18n.language === lang.code && styles.langNameActive
                ]}>
                  {lang.nativeName} ({lang.name})
                </Text>
                {i18n.language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper component for cleaner rows
const InfoRow = ({ icon, label, value, isEditing, onChange, keyboardType = "default" }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBox}>
      <Icon name={icon} size={22} color={Colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditing ? (
        <TextInput 
          style={styles.inputField} 
          value={value} 
          onChangeText={onChange}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerBackground: {
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.secondary,
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
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
    marginLeft: 60,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logoutBtn: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  langOptionActive: {
    backgroundColor: '#E0F2F1',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    borderBottomWidth: 0,
  },
  langName: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  langNameActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  inputUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    minWidth: 150,
    textAlign: 'center'
  },
  inputField: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
  },
});