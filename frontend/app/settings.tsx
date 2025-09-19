import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocationUtils } from '../hooks/useLocation';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    location,
    isLoading,
    error,
    hasPermission,
    startLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
    requestPermission,
    formatLocation,
    formatAddress,
  } = useLocationUtils();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert('Success', 'Location permission granted!');
    }
  };

  const handleGetCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();
    if (currentLocation) {
      Alert.alert('Location Updated', `Current location: ${formatAddress(currentLocation)}`);
    }
  };

  const handleToggleTracking = () => {
    if (hasPermission) {
      if (location) {
        stopLocationTracking();
        Alert.alert('Location Tracking', 'Location tracking has been stopped.');
      } else {
        startLocationTracking();
        Alert.alert('Location Tracking', 'Location tracking has been started.');
      }
    } else {
      Alert.alert(
        'Permission Required',
        'Location permission is required to start tracking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: handleRequestPermission }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Location Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Permission Status */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Permission Status</Text>
          
          <View style={styles.statusItem}>
            <Ionicons 
              name={hasPermission ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={hasPermission ? "#2ecc71" : "#e74c3c"} 
            />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {hasPermission ? "Location Permission Granted" : "Location Permission Denied"}
            </Text>
          </View>

          {!hasPermission && (
            <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
              <Text style={styles.permissionButtonText}>Request Permission</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Current Location */}
        {hasPermission && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Location</Text>
            
            {location ? (
              <View style={styles.locationInfo}>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={20} color={colors.tint} />
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    {formatAddress(location)}
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="navigate" size={20} color={colors.text} />
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    {formatLocation(location)}
                  </Text>
                </View>
                {location.accuracy && (
                  <View style={styles.locationRow}>
                    <Ionicons name="target" size={20} color={colors.text} />
                    <Text style={[styles.locationText, { color: colors.text }]}>
                      Accuracy: {Math.round(location.accuracy)}m
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.noLocationText, { color: colors.text }]}>
                No location data available
              </Text>
            )}

            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={handleGetCurrentLocation}
              disabled={isLoading}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>
                {isLoading ? "Getting Location..." : "Refresh Location"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location Tracking */}
        {hasPermission && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Tracking</Text>
            
            <View style={styles.trackingItem}>
              <View style={styles.trackingInfo}>
                <Ionicons name="location" size={24} color={colors.tint} />
                <View style={styles.trackingTextContainer}>
                  <Text style={[styles.trackingTitle, { color: colors.text }]}>
                    Background Tracking
                  </Text>
                  <Text style={[styles.trackingDescription, { color: colors.text }]}>
                    Continuously track your location for fishing logs and navigation
                  </Text>
                </View>
              </View>
              <Switch
                value={!!location}
                onValueChange={handleToggleTracking}
                trackColor={{ false: '#bdc3c7', true: colors.tint }}
                thumbColor={location ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Error</Text>
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={24} color="#e74c3c" />
              <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            </View>
          </View>
        )}

        {/* Information */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Information</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Location data is used to provide accurate fishing zone recommendations, 
            track your fishing trips, and provide location-based weather information. 
            Your location data is stored locally on your device and is not shared with third parties.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    marginLeft: 12,
  },
  permissionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  noLocationText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  trackingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trackingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
