import axios from 'axios';

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

export const fetchNotifications = async (latitude: number, longitude: number): Promise<AlertData[]> => {
  try {
    console.log(`Sending request to ${BACKEND_URL}/notifications with lat: ${latitude}, lon: ${longitude}`);
    const response = await axios.post(`${BACKEND_URL}/notifications`, {
      latitude,
      longitude,
    }, {
      timeout: 10000 // 10 second timeout
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
