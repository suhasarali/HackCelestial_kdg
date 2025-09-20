import { useEffect, useRef } from "react";
import { sendAlertNotification } from "./notification";
import { useAlerts } from "../context/AlertContext";

export default function AlertListener() {
  const prevDataRef = useRef<string | null>(null);
  const { alerts, setAlerts } = useAlerts();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("https://hackcelestial-kdg-1.onrender.com/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: "57.8", longitude: "40.5" }),
        });

        if (!res.ok) {
          console.error("❌ Server returned error:", res.status, await res.text());
          return;
        }

        const data = await res.json();
        const currentSignature = JSON.stringify(data?.threats || {});
        if (currentSignature === prevDataRef.current) return;
        prevDataRef.current = currentSignature;

        if (data?.status === "Active Threats Detected" && data?.threats?.weatherAlerts?.length) {
          const newAlerts = data.threats.weatherAlerts.map((alert: any, i: number) => ({
            id: `${Date.now()}-${i}`,
            type: "weather",
            title: `⚠️ ${alert.headline} (${alert.severity})`,
            message: alert.description,
            priority: alert.severity.toLowerCase() === "severe" ? "high" : "medium",
            timestamp: new Date().toISOString(),
            read: false,
          }));

          setAlerts(newAlerts); // ✅ Update context so alerts page updates too

          for (const a of newAlerts) {
            await sendAlertNotification({
              title: a.title,
              body: a.message,
              sound: "default",
            });
          }
        }
      } catch (err) {
        console.error("❌ Error fetching alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
