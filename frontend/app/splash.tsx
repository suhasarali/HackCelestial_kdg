import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../context/LocationContext';

export default function SplashScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isLoading, user } = useAuth();
  const { startLocationTracking } = useLocation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start location tracking
    startLocationTracking();
  }, [fadeAnim, scaleAnim, pulseAnim, startLocationTracking]);

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const timestamp = await AsyncStorage.getItem('usertokenTimestamp');
        const TOKEN_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

        console.log('Stored Token:', storedToken);
        console.log('Token Timestamp:', timestamp);
        console.log('Current Time:', Date.now());

        let isValid = false;

        if (storedToken && timestamp) {
          const storedTime = parseInt(timestamp, 10);
          const currentTime = Date.now();

          if (storedTime && currentTime - storedTime <= TOKEN_EXPIRY_TIME) {
            isValid = true;
          } else {
            // Expired → remove token
            await AsyncStorage.multiRemove(['token', 'usertokenTimestamp']);
          }
        }

        // Delay navigation slightly for splash effect
        setTimeout(() => {
          if (isValid) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/auth/login');
          }
        }, 2500);
      } catch (err) {
        console.error('Error checking auth:', err);
        router.replace('/auth/login');
      }
    };

    if (!isLoading) {
      checkAuthAndNavigate();
    }
  }, [isLoading, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/matsya-logo.svg')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.appName,
          {
            color: colors.text,
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        Matsya
      </Animated.Text>

      <Animated.Text
        style={[
          styles.tagline,
          {
            color: colors.icon,
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        Aquatic Intelligence Platform
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});
