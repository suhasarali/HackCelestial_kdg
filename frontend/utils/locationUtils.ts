import { LocationData } from '../context/LocationContext';

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

/**
 * Check if a location is recent (within specified minutes)
 * @param location Location data
 * @param maxAgeMinutes Maximum age in minutes (default: 5)
 * @returns True if location is recent
 */
export const isLocationRecent = (location: LocationData | null, maxAgeMinutes: number = 5): boolean => {
  if (!location) return false;
  
  const now = Date.now();
  const locationTime = location.timestamp;
  const ageMinutes = (now - locationTime) / (1000 * 60);
  
  return ageMinutes <= maxAgeMinutes;
};

/**
 * Format location coordinates for display
 * @param location Location data
 * @param precision Number of decimal places (default: 6)
 * @returns Formatted coordinates string
 */
export const formatCoordinates = (location: LocationData | null, precision: number = 6): string => {
  if (!location) return 'Location not available';
  
  return `${location.latitude.toFixed(precision)}, ${location.longitude.toFixed(precision)}`;
};

/**
 * Format location address for display
 * @param location Location data
 * @returns Formatted address string
 */
export const formatAddress = (location: LocationData | null): string => {
  if (!location) return 'Address not available';
  
  return location.address || formatCoordinates(location);
};

/**
 * Get location accuracy status
 * @param location Location data
 * @returns Accuracy status string
 */
export const getAccuracyStatus = (location: LocationData | null): string => {
  if (!location || !location.accuracy) return 'Unknown';
  
  if (location.accuracy <= 10) return 'Excellent';
  if (location.accuracy <= 50) return 'Good';
  if (location.accuracy <= 100) return 'Fair';
  return 'Poor';
};

/**
 * Create a location object from coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @param accuracy Accuracy in meters
 * @param address Optional address
 * @returns LocationData object
 */
export const createLocationData = (
  latitude: number,
  longitude: number,
  accuracy?: number | null,
  address?: string
): LocationData => {
  return {
    latitude,
    longitude,
    accuracy: accuracy || null,
    altitude: null,
    timestamp: Date.now(),
    address,
  };
};

/**
 * Validate if coordinates are within valid ranges
 * @param latitude Latitude to validate
 * @param longitude Longitude to validate
 * @returns True if coordinates are valid
 */
export const isValidCoordinates = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
};

/**
 * Calculate bearing between two points
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Bearing in degrees (0-360)
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

/**
 * Get compass direction from bearing
 * @param bearing Bearing in degrees
 * @returns Compass direction string
 */
export const getCompassDirection = (bearing: number): string => {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
};
