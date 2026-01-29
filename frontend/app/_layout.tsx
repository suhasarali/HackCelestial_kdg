// app/layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';
import React from 'react';
import { AlertProvider } from '@/context/AlertContext';
import '../i18n';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <AlertProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="splash" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            </Stack>
            </AlertProvider>
          </LocationProvider>
        </AuthProvider>
    </SafeAreaProvider>
  );
}