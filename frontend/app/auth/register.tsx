import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/design';

const { height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [boatLicenseId, setBoatLicenseId] = useState('');
  const [experience, setExperience] = useState('');
  const [port, setPort] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, message: '' });

  const { register } = useAuth();
  const { t } = useTranslation();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !boatLicenseId || !experience || !port) {
      Alert.alert(t('auth.incomplete'), t('auth.incompleteMsg'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('auth.invalidEmail'), t('auth.invalidEmailMsg'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('auth.passwordShort'), t('auth.passwordShortMsg'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('auth.mismatch'), t('auth.mismatchMsg'));
      return;
    }

    setLoading(true);

    try {
      const success = await register(name, email, password, {
        boatLicenseId,
        experience,
        port,
      });

      if (success) {
        router.replace('/(tabs)/home' as any);
      }
    } catch (error) {
        // Handled by context usually
    } finally {
        setLoading(false);
    }
  };

  const showTooltip = (message: string) => {
    setTooltip({ visible: true, message });
    // Auto hide after 3 seconds
    setTimeout(() => {
        setTooltip({ visible: false, message: '' });
    }, 3000);
  };

  const renderInput = (
    value: string,
    onChange: (text: string) => void,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    keyType: any = 'default',
    isSecure: boolean = false,
    showSecureToggle: boolean = false,
    toggleSecure?: () => void,
    infoMessage?: string
  ) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        value={value}
        onChangeText={onChange}
        autoCapitalize={keyType === 'email-address' ? 'none' : 'words'}
        keyboardType={keyType}
        secureTextEntry={isSecure}
        editable={!loading}
      />
      {showSecureToggle && toggleSecure && (
        <TouchableOpacity onPress={toggleSecure} style={styles.actionIcon}>
             <Ionicons name={!isSecure ? "eye-outline" : "eye-off-outline"} size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
      {infoMessage && (
        <TouchableOpacity onPress={() => showTooltip(infoMessage)} style={styles.actionIcon}>
          <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={Colors.gradientPrimary}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
               <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                 <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
               </TouchableOpacity>
               <View>
                 <Text style={styles.title}>{t('auth.createAccount')}</Text>
                 <Text style={styles.subtitle}>{t('auth.joinFleet')}</Text>
               </View>
            </View>

            <View style={styles.card}>
               {/* Tooltip Overlay */}
              {tooltip.visible && (
                <View style={styles.tooltipBubble}>
                  <Text style={styles.tooltipText}>{tooltip.message}</Text>
                </View>
              )}

              {renderInput(name, setName, t('auth.fullName'), "person-outline")}
              {renderInput(email, setEmail, t('auth.emailPlaceholder'), "mail-outline", "email-address")}
              {renderInput(boatLicenseId, setBoatLicenseId, t('auth.boatLicense'), "card-outline")}
              {renderInput(
                  experience, 
                  setExperience, 
                  t('auth.experience'), 
                  "time-outline", 
                  "numeric", 
                  false, 
                  false, 
                  undefined, 
                  t('auth.experienceTooltip')
              )}
              {renderInput(
                  port, 
                  setPort, 
                  t('auth.port'), 
                  "location-outline", 
                  "default", 
                  false, 
                  false, 
                  undefined, 
                  t('auth.portTooltip')
              )}

              <View style={styles.divider} />

              {renderInput(password, setPassword, t('auth.passwordPlaceholder'), "lock-closed-outline", "default", !showPassword, true, () => setShowPassword(!showPassword))}
              {renderInput(confirmPassword, setConfirmPassword, t('auth.confirmPassword'), "lock-closed-outline", "default", !showConfirmPassword, true, () => setShowConfirmPassword(!showConfirmPassword))}

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradientTeal}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.textInverse} />
                  ) : (
                    <Text style={styles.buttonText}>{t('auth.register')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity disabled={loading}>
                    <Text style={styles.link}>{t('auth.signIn')}</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'], // Extra padding for scroll
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  actionIcon: {
    padding: Spacing.xs,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    height: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    borderRadius: BorderRadius.lg,
    ...Shadows.teal,
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  button: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
  link: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.base,
  },
  tooltipBubble: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    zIndex: 10,
    ...Shadows.md,
  },
  tooltipText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
