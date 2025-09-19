# Location Tracking Implementation

This document explains how location tracking is implemented in the Matsya fishing app using expo-location.

## Overview

The app includes comprehensive location tracking functionality that:
- Tracks user location continuously in the background
- Stores location data in AsyncStorage for persistence
- Provides location-based features throughout the app
- Handles permissions gracefully
- Offers location utilities for fishing-related calculations

## Architecture

### 1. LocationContext (`context/LocationContext.tsx`)
The main context provider that manages location state throughout the app.

**Key Features:**
- Automatic location tracking with configurable intervals
- Permission management
- Location data persistence in AsyncStorage
- Error handling and loading states
- Address reverse geocoding

**Usage:**
```typescript
import { useLocation } from '../context/LocationContext';

const { location, isLoading, error, getCurrentLocation } = useLocation();
```

### 2. Location Hook (`hooks/useLocation.ts`)
Enhanced hook with utility functions for easier location usage.

**Additional Features:**
- Location formatting utilities
- Distance calculations
- Location freshness checking
- Re-export of base location context

**Usage:**
```typescript
import { useLocationUtils } from '../hooks/useLocation';

const { formatLocation, formatAddress, getDistanceFromLocation } = useLocationUtils();
```

### 3. Location Display Component (`components/LocationDisplay.tsx`)
Reusable component for displaying location information.

**Props:**
- `showAddress`: Display formatted address
- `showCoordinates`: Display coordinates
- `showAccuracy`: Display accuracy information
- `compact`: Compact display mode
- `onPress`: Custom press handler

**Usage:**
```typescript
<LocationDisplay 
  showAddress={true}
  showCoordinates={true}
  showAccuracy={true}
  compact={false}
/>
```

### 4. Location Utilities (`utils/locationUtils.ts`)
Utility functions for location-based calculations and formatting.

**Functions:**
- `calculateDistance()`: Calculate distance between two points
- `formatDistance()`: Format distance for display
- `isLocationRecent()`: Check if location is recent
- `formatCoordinates()`: Format coordinates for display
- `calculateBearing()`: Calculate bearing between points
- `getCompassDirection()`: Get compass direction from bearing

## Permissions

### iOS Permissions (app.json)
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "This app needs access to location to track your fishing location and provide location-based services.",
      "NSLocationAlwaysAndWhenInUseUsageDescription": "This app needs access to location to track your fishing location and provide location-based services.",
      "NSLocationAlwaysUsageDescription": "This app needs access to location to track your fishing location and provide location-based services."
    }
  }
}
```

### Android Permissions (app.json)
```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION"
    ]
  }
}
```

## Configuration

### Location Tracking Settings
- **Update Interval**: 30 seconds (configurable in LocationContext)
- **Distance Interval**: 10 meters (configurable in LocationContext)
- **Accuracy**: High accuracy mode
- **Storage Key**: 'app_location' in AsyncStorage

### Automatic Features
- Location tracking starts automatically on app launch (in splash screen)
- Location data is automatically saved to AsyncStorage when it changes
- Permission requests are handled automatically with user-friendly messages

## Usage Examples

### 1. Basic Location Access
```typescript
import { useLocation } from '../context/LocationContext';

function MyComponent() {
  const { location, isLoading, getCurrentLocation } = useLocation();

  const handleGetLocation = async () => {
    const currentLocation = await getCurrentLocation();
    if (currentLocation) {
      console.log('Current location:', currentLocation);
    }
  };

  return (
    <View>
      {location ? (
        <Text>Lat: {location.latitude}, Lng: {location.longitude}</Text>
      ) : (
        <Text>No location available</Text>
      )}
    </View>
  );
}
```

### 2. Distance Calculation
```typescript
import { useLocationUtils } from '../hooks/useLocation';
import { calculateDistance, formatDistance } from '../utils/locationUtils';

function FishingZone({ zone }) {
  const { location } = useLocationUtils();

  const getDistanceToZone = () => {
    if (!location) return 'Unknown';
    
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      zone.latitude,
      zone.longitude
    );
    
    return formatDistance(distance);
  };

  return (
    <View>
      <Text>{zone.name}</Text>
      <Text>{getDistanceToZone()} away</Text>
    </View>
  );
}
```

### 3. Location Display
```typescript
import LocationDisplay from '../components/LocationDisplay';

function HomeScreen() {
  return (
    <View>
      <LocationDisplay 
        showAddress={true}
        showCoordinates={false}
        showAccuracy={true}
      />
    </View>
  );
}
```

### 4. Settings Screen
The app includes a dedicated settings screen (`app/settings.tsx`) where users can:
- View permission status
- See current location information
- Toggle background tracking
- Refresh location manually
- View error messages

## Data Storage

Location data is stored in AsyncStorage with the key 'app_location' and includes:
```typescript
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
  address?: string;
}
```

## Error Handling

The location system includes comprehensive error handling:
- Permission denied scenarios
- Location service disabled
- Network connectivity issues
- GPS accuracy problems
- User-friendly error messages

## Performance Considerations

- Location updates are throttled to prevent excessive battery usage
- Location data is cached and only updated when significantly different
- Background tracking can be disabled by users
- Automatic cleanup when app is unmounted

## Integration Points

The location system is integrated with:
- **Splash Screen**: Starts location tracking on app launch
- **Home Screen**: Displays current location information
- **Map Screen**: Provides location for map centering and navigation
- **Catch Log**: Records location with each catch
- **Settings**: Allows users to manage location preferences

## Testing

To test the location functionality:
1. Ensure location permissions are granted
2. Test on both iOS and Android devices
3. Verify location updates in different scenarios
4. Test permission denial handling
5. Verify data persistence across app restarts

## Troubleshooting

Common issues and solutions:
- **Permission denied**: Check app.json permissions and request permission programmatically
- **Location not updating**: Verify location services are enabled on device
- **Poor accuracy**: Check GPS signal strength and device settings
- **Background tracking not working**: Ensure background location permission is granted

## Future Enhancements

Potential improvements:
- Geofencing for fishing zones
- Location-based weather integration
- Route tracking for fishing trips
- Offline location caching
- Location sharing with other users
