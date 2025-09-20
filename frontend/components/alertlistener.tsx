// AlertListener.tsx
import { useEffect, useRef } from "react";
import { sendAlertNotification } from "./notification";

export default function AlertListener() {
  const prevDataRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("https://hackcelestial-kdg.onrender.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: 19.076, longitude: 72.8777 }),
        });

        // ✅ Handle non-200 responses
        if (!res.ok) {
          const rawText = await res.text();
          console.error("❌ Server returned error:", res.status, rawText);
          return;
        }

        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          const rawText = await res.text();
          console.error("❌ Could not parse JSON. Got:", rawText);
          return;
        }

        console.log("Fetched alerts:", data);

        // Convert threats into a string signature to detect changes
        const currentSignature = JSON.stringify(data?.threats || {});
        if (currentSignature === prevDataRef.current) {
          // No new data, skip
          return;
        }
        prevDataRef.current = currentSignature;

        // ✅ Only notify if status says "Active Threats Detected"
        if (data?.status === "Active Threats Detected" && data?.threats?.weatherAlerts?.length) {
          for (const alert of data.threats.weatherAlerts) {
            await sendAlertNotification({
              title: `⚠️ ${alert.headline || "Weather Alert"} (${alert.severity})`,
              body: alert.description || "No description provided",
              sound: "default",
            });
          }
        } else {
          console.log("✅ No active threats detected");
        }
      } catch (err) {
        console.error("❌ Error fetching alerts:", err);
      }
    };

    // Fetch immediately on mount
    fetchAlerts();

    // Poll every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null; // invisible component
}
