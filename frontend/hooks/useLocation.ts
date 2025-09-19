import { useLocation } from '../context/LocationContext';

// Re-export the location hook for easier imports
export { useLocation };

// Additional utility functions for location
export const useLocationUtils = () => {
  const locationContext = useLocation();

  const formatLocation = (location: typeof locationContext.location) => {
    if (!location) return 'Location not available';
    
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatAddress = (location: typeof locationContext.location) => {
    if (!location) return 'Address not available';
    
    return location.address || formatLocation(location);
  };

  const getDistanceFromLocation = (
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
    const distance = R * c;
    return distance;
  };

  const isLocationRecent = (location: typeof locationContext.location, maxAgeMinutes: number = 5): boolean => {
    if (!location) return false;
    
    const now = Date.now();
    const locationTime = location.timestamp;
    const ageMinutes = (now - locationTime) / (1000 * 60);
    
    return ageMinutes <= maxAgeMinutes;
  };

  return {
    ...locationContext,
    formatLocation,
    formatAddress,
    getDistanceFromLocation,
    isLocationRecent,
  };
};
