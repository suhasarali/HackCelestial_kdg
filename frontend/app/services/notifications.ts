import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALERT_CACHE_KEY = '@recent_alerts_cache';


const BACKEND_URL = 'https://hackcelestial-kdg-1.onrender.com';

export interface AlertData {
  id: string;
  title: string;
  body: string;
  category: 'weather' | 'regulation' | 'market' | 'safety' | 'general';
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  isRead: boolean;
}

export interface SpotItem {
  id: string;
  name: string;
  type: string;
  distance: string; // mapped from distance_approx
  rating: number;
  reason: string;
  safety: string;   // mapped from difficulty
  fishTypes: string[]; // split from best_catch
  image?: any;
}



export const fetchNotifications = async (latitude: number, longitude: number): Promise<AlertData[]> => {
  try {
    //console.log(`Sending request to ${BACKEND_URL}/notifications with lat: ${latitude}, lon: ${longitude}`);
    const response = await axios.post(`${BACKEND_URL}/notifications`, {
      latitude,
      longitude,
    });
    console.log('Backend response received:', response.status);

    const data = response.data;
    const alerts: AlertData[] = [];

    if (data.status === "Active Threats Detected" || data.threats) {
      const { earthquakes, weatherAlerts, fishingAlerts } = data.threats;

      // Process Earthquakes
      if (earthquakes && earthquakes.length > 0) {
        earthquakes.forEach((eq: any, index: number) => {
          alerts.push({
            id: `eq-${index}-${Date.now()}`,
            title: `Earthquake: ${eq.place}`,
            body: `Magnitude: ${eq.magnitude}. Time: ${eq.time}.`,
            category: 'safety',
            priority: eq.magnitude >= 5 ? 'high' : 'medium',
            timestamp: eq.time, // You might want to format this relative to now
            isRead: false,
          });
        });
      }

      // Process Weather Alerts
      if (weatherAlerts && weatherAlerts.length > 0) {
        weatherAlerts.forEach((wa: any, index: number) => {
          alerts.push({
            id: `wa-${index}-${Date.now()}`,
            title: wa.headline || wa.type,
            body: `${wa.area}: ${wa.description}`,
            category: 'weather',
            priority: wa.severity === 'Severe' || wa.severity === 'Extreme' ? 'high' : 'medium',
            timestamp: new Date().toISOString(), // Weather API might not give a timestamp per alert easily?
            isRead: false,
          });
        });
      }

      // Process Fishing Alerts (IMD)
      if (fishingAlerts && fishingAlerts.length > 0) {
        fishingAlerts.forEach((fa: any, index: number) => {
          alerts.push({
            id: `fa-${index}-${Date.now()}`,
            title: `Sea Bulletin: ${fa.location}`,
            body: `${fa.meaning} (Intensity: ${fa.intensity}, Status: ${fa.status})`,
            category: 'weather', // Fits best for sea conditions
            priority: fa.status === 'Danger' || fa.status === 'Warning' ? 'high' : 'medium',
            timestamp: fa.date || new Date().toISOString(),
            isRead: false,
          });
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const loadCachedAlerts = async (): Promise<AlertData[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(ALERT_CACHE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading cached alerts:', e);
    return [];
  }
};

export const cacheAlerts = async (alerts: AlertData[]): Promise<void> => {
  try {
    const top5 = alerts.slice(0, 5);
    await AsyncStorage.setItem(ALERT_CACHE_KEY, JSON.stringify(top5));
  } catch (e) {
    console.error('Error caching alerts:', e);
  }
};
export const fetchPopularSpots = async (latitude: number, longitude: number): Promise<SpotItem[]> => {
  try {
    const response = await axios.post(`${BACKEND_URL}/popular-spots`, {
      latitude,
      longitude,
    });

    const data = response.data;
    console.log('Popular spots data received:', data);

    if (data.status === "success" && Array.isArray(data.spots)) {
      return data.spots.map((spot: any, index: number) => {
        let safetyStatus = "Safe";
        if (spot.difficulty === "Medium") safetyStatus = "Moderate";
        if (spot.difficulty === "Hard") safetyStatus = "Caution";

        return {
          // Unique string ID to prevent $NaN errors
          id: `spot-${index}-${spot.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: spot.name,
          type: spot.type,
          distance: spot.distance_approx,
          rating: 4.5,
          reason: spot.best_catch,
          safety: safetyStatus,
          fishTypes: spot.best_catch ? spot.best_catch.split(',').map((f: string) => f.trim()) : [],
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching popular spots API:", error);
    return [];
  }
};