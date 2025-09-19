import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
  address?: string;
}

interface LocationContextType {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
  requestPermission: () => Promise<boolean>;
}

const LocationContext = createContext<LocationContextType>({} as LocationContextType);

export const useLocation = () => useContext(LocationContext);

const LOCATION_STORAGE_KEY = 'app_location';
const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isTrackingRef = useRef(false);

  // Load saved location on app start
  useEffect(() => {
    loadSavedLocation();
    checkPermissionStatus();
  }, []);

  // Save location to AsyncStorage whenever it changes
  useEffect(() => {
    if (location) {
      saveLocationToStorage(location);
    }
  }, [location]);

  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        setLocation(parsedLocation);
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    }
  };

  const saveLocationToStorage = async (locationData: LocationData) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if permission is already granted
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // Request permission
        const permissionResponse = await Location.requestForegroundPermissionsAsync();
        status = permissionResponse.status;
      }

      if (status !== 'granted') {
        setError('Location permission denied');
        setHasPermission(false);
        
        Alert.alert(
          'Permission Required',
          'This app needs location permission to provide location-based services. Please enable location access in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }

      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Failed to request location permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!hasPermission) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) {
          return null;
        }
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      const locationData: LocationData = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy,
        altitude: locationResult.coords.altitude,
        timestamp: locationResult.timestamp,
      };

      // Try to get address from coordinates
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          locationData.address = `${address.name || ''} ${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim();
        }
      } catch (geocodeError) {
        console.warn('Error getting address:', geocodeError);
      }

      setLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      setError('Failed to get current location');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      if (isTrackingRef.current) {
        console.log('Location tracking already active');
        return;
      }

      setIsLoading(true);
      setError(null);

      if (!hasPermission) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) {
          return;
        }
      }

      // Get initial location
      await getCurrentLocation();

      // Start background location tracking
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: 10, // Update every 10 meters
        },
        (locationResult) => {
          const locationData: LocationData = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
            accuracy: locationResult.coords.accuracy,
            altitude: locationResult.coords.altitude,
            timestamp: locationResult.timestamp,
          };

          setLocation(locationData);
        }
      );

      locationSubscriptionRef.current = subscription;
      isTrackingRef.current = true;
      
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setError('Failed to start location tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const stopLocationTracking = () => {
    try {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      isTrackingRef.current = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    hasPermission,
    startLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
    requestPermission,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
