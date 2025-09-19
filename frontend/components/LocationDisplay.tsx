import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationUtils } from '../hooks/useLocation';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';

interface LocationDisplayProps {
  showAddress?: boolean;
  showCoordinates?: boolean;
  showAccuracy?: boolean;
  onPress?: () => void;
  style?: any;
  compact?: boolean;
}

export default function LocationDisplay({
  showAddress = true,
  showCoordinates = false,
  showAccuracy = false,
  onPress,
  style,
  compact = false,
}: LocationDisplayProps) {
  const {
    location,
    isLoading,
    error,
    hasPermission,
    getCurrentLocation,
    formatLocation,
    formatAddress,
    isLocationRecent,
  } = useLocationUtils();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (!isLoading) {
      getCurrentLocation();
    }
  };

  const renderLocationContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Getting location...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={16} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {error}
          </Text>
        </View>
      );
    }

    if (!hasPermission) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={16} color={colors.destructive} />
          <Text style={[styles.permissionText, { color: colors.destructive }]}>
            Location permission required
          </Text>
        </View>
      );
    }

    if (!location) {
      return (
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={16} color={colors.text} />
          <Text style={[styles.noLocationText, { color: colors.text }]}>
            Tap to get location
          </Text>
        </View>
      );
    }

    const isRecent = isLocationRecent(location);
    const locationIcon = isRecent ? 'location' : 'location-outline';
    const iconColor = isRecent ? colors.tint : colors.text;

    return (
      <View style={styles.locationContainer}>
        <Ionicons name={locationIcon} size={16} color={iconColor} />
        <View style={styles.locationTextContainer}>
          {showAddress && (
            <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={compact ? 1 : 2}>
              {formatAddress(location)}
            </Text>
          )}
          {showCoordinates && (
            <Text style={[styles.coordinatesText, { color: colors.text }]}>
              {formatLocation(location)}
            </Text>
          )}
          {showAccuracy && location.accuracy && (
            <Text style={[styles.accuracyText, { color: colors.text }]}>
              Accuracy: {Math.round(location.accuracy)}m
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background }, style]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {renderLocationContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  permissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noLocationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
