// AlertListener.tsx
import { useEffect } from 'react';
import { sendAlertNotification } from './notification';

export default function AlertListener() {
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("https://hackcelestial-kdg.onrender.com/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: 19.076, longitude: 72.8777 }) // replace with real location
        });

        const data = await res.json();

        // Earthquake alerts
        if (data.threats?.earthquakes?.length) {
          for (const quake of data.threats.earthquakes) {
            await sendAlertNotification({
              type: "earthquake",
              message: `M${quake.magnitude} - ${quake.place}`,
              priority: "high"
            });
          }
        }

        // Weather alerts
        if (data.threats?.weatherAlerts?.length) {
          for (const weather of data.threats.weatherAlerts) {
            await sendAlertNotification({
              type: "weather",
              message: `${weather.headline} - ${weather.description}`,
              priority: "high"
            });
          }
        }
      } catch (err) {
        console.error("❌ Error fetching alerts:", err);
      }
    };

    // fetch immediately
    fetchAlerts();

    // poll every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null; // invisible component
}
